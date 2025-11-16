# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import time
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)  # allow requests from your React dev server

# Path to your DB file (relative to backend folder)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, '..', 'sql_runner.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # so we can create dicts
    return conn

def serialize_rows(cursor, rows):
    columns = [col[0] for col in cursor.description] if cursor.description else []
    data = [dict(zip(columns, row)) for row in rows]
    return columns, data

@app.route('/tables', methods=['GET'])
def list_tables():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [r[0] for r in cur.fetchall()]
        return jsonify({"status":"success", "tables": tables})
    except Exception as e:
        return jsonify({"status":"error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/table-info/<table_name>', methods=['GET'])
def table_info(table_name):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(f"PRAGMA table_info({table_name});")
        cols = [{"cid": r[0], "name": r[1], "type": r[2], "notnull": r[3], "dflt_value": r[4], "pk": r[5]} for r in cur.fetchall()]
        # Also provide a few sample rows
        cur.execute(f"SELECT * FROM {table_name} LIMIT 5;")
        rows = cur.fetchall()
        columns = [c["name"] for c in cols]
        sample = [dict(row) for row in rows]
        return jsonify({"status":"success", "columns": cols, "sample": sample})
    except sqlite3.Error as e:
        return jsonify({"status":"error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"status":"error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/preview/<table_name>', methods=['GET'])
def preview_table(table_name):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM {table_name} LIMIT 5;")
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description] if cur.description else []
        data = [dict(row) for row in rows]
        return jsonify({"status":"success", "columns": cols, "rows": data})
    except sqlite3.Error as e:
        return jsonify({"status":"error", "message": str(e)}), 400
    finally:
        conn.close()

@app.route('/execute-query', methods=['POST'])
def execute_query():
    payload = request.get_json() or {}
    query = payload.get('query', '').strip()
    username = payload.get('username')  # optional, for history
    if not query:
        return jsonify({"status":"error", "message":"No query provided"}), 400

    # basic safety: disallow `ATTACH` or writing to filesystem etc. (adjust as you want)
    banned = ['ATTACH', 'DETACH']
    if any(query.upper().startswith(b) for b in banned):
        return jsonify({"status":"error", "message":"This statement is not allowed."}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        # If it's a SELECT (read) — fetch results
        if query.lstrip().lower().startswith('select'):
            cur.execute(query)
            rows = cur.fetchall()
            cols, data = serialize_rows(cur, rows)
            # optionally save history
            if username:
                save_history_to_db(username, query, conn)
            return jsonify({"status":"success", "columns": cols, "rows": data})

        # For other DML (INSERT/UPDATE/DELETE) or DDL (CREATE etc.)
        else:
            cur.execute(query)
            conn.commit()
            affected = cur.rowcount if hasattr(cur, 'rowcount') else None
            if username:
                save_history_to_db(username, query, conn)
            return jsonify({"status":"success", "message":"Query executed", "rows_affected": affected})
    except sqlite3.Error as e:
        return jsonify({"status":"error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"status":"error", "message": str(e)}), 500
    finally:
        conn.close()

# Simple QueryHistory table helpers (optional but recommended)
def init_history_table():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS QueryHistory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                query TEXT,
                ts INTEGER
            );
        """)
        conn.commit()
    finally:
        conn.close()

def save_history_to_db(username, query, conn=None):
    # if a connection is passed, use it; else create one
    close_conn = False
    if conn is None:
        conn = get_connection()
        close_conn = True
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO QueryHistory (username, query, ts) VALUES (?, ?, ?);",
                    (username, query, int(time.time())))
        conn.commit()
    except Exception:
        pass
    finally:
        if close_conn:
            conn.close()

# --- NEW: Signup endpoint ---
@app.route('/signup', methods=['POST'])
def signup():
    payload = request.get_json() or {}
    username = (payload.get('username') or "").strip()
    password = (payload.get('password') or "").strip()

    if not username or not password:
        return jsonify({"status": "error", "message": "username and password required"}), 400
    if len(password) < 6:
        return jsonify({"status": "error", "message": "password must be at least 6 characters"}), 400

    # Hash password
    password_hash = generate_password_hash(password)

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO Users (username, password_hash, created_ts)
            VALUES (?, ?, ?)
        """, (username, password_hash, int(time.time())))
        conn.commit()
        return jsonify({"status": "success", "user": {"username": username}})
    except sqlite3.IntegrityError:
        return jsonify({"status": "error", "message": "username already exists"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()




# --- NEW: Login endpoint ---
@app.route('/login', methods=['POST'])
def login():
    payload = request.get_json() or {}
    username = (payload.get('username') or "").strip()
    password = (payload.get('password') or "").strip()

    if not username or not password:
        return jsonify({"status": "error", "message": "username and password required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT password_hash FROM Users WHERE username=?", (username,))
        row = cur.fetchone()

        if not row:
            return jsonify({"status": "error", "message": "invalid credentials"}), 401

        password_hash = row["password_hash"]
        if not check_password_hash(password_hash, password):
            return jsonify({"status": "error", "message": "invalid credentials"}), 401

        # success
        return jsonify({
            "status": "success",
            "user": {"username": username}
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()



@app.route('/history', methods=['GET'])
def get_history():
    username = request.args.get('username')
    if not username:
        return jsonify({"status":"error", "message":"username required"}), 400
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT query, ts FROM QueryHistory WHERE username=? ORDER BY ts DESC LIMIT 100;", (username,))
        rows = [{"query": r[0], "ts": r[1]} for r in cur.fetchall()]
        return jsonify({"status":"success", "history": rows})
    except Exception as e:
        return jsonify({"status":"error", "message": str(e)}), 500
    finally:
        conn.close()


# --- NEW: Create Users table ---
def init_users_table():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_ts INTEGER
            );
        """)
        conn.commit()
    finally:
        conn.close()







if __name__ == '__main__':
    init_history_table()
    init_users_table()
    app.run(host='0.0.0.0', port=5000, debug=True)
