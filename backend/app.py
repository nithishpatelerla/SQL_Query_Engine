# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import time
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# ============================================================
# 🚀 FINAL DB PATH LOGIC (100% Render + Docker compatible)
# ============================================================
# Render/Docker: DB is copied to /app/sql_runner.db (inside container)
# Local: fallback to root folder ../sql_runner.db (same as before)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "sql_runner.db")   # for Docker
FALLBACK_DB_PATH = os.path.join(BASE_DIR, "..", "sql_runner.db")  # for local dev

# Environment variable overrides inside Docker container
DB_PATH = os.environ.get("DB_PATH")

if DB_PATH:
    DB_PATH = DB_PATH
elif os.path.exists(DEFAULT_DB_PATH):
    DB_PATH = DEFAULT_DB_PATH
else:
    DB_PATH = FALLBACK_DB_PATH

print("📌 Using SQLite DB:", DB_PATH)


# ============================================================
# DB CONNECTION
# ============================================================
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def serialize_rows(cursor, rows):
    columns = [col[0] for col in cursor.description] if cursor.description else []
    data = [dict(zip(columns, row)) for row in rows]
    return columns, data


# ============================================================
# TABLE LIST
# ============================================================
@app.route('/tables', methods=['GET'])
def list_tables():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [r[0] for r in cur.fetchall()]
        return jsonify({"status": "success", "tables": tables})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()


# ============================================================
# TABLE INFO
# ============================================================
@app.route('/table-info/<table>', methods=['GET'])
def table_info(table):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(f"PRAGMA table_info({table});")
        cols = [
            {"cid": r[0], "name": r[1], "type": r[2], "notnull": r[3], "dflt_value": r[4], "pk": r[5]}
            for r in cur.fetchall()
        ]

        cur.execute(f"SELECT * FROM {table} LIMIT 5;")
        sample = [dict(row) for row in cur.fetchall()]

        return jsonify({"status": "success", "columns": cols, "sample": sample})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()


# ============================================================
# PREVIEW
# ============================================================
@app.route('/preview/<table>', methods=['GET'])
def preview(table):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM {table} LIMIT 5;")
        rows = [dict(row) for row in cur.fetchall()]
        cols = [c[0] for c in cur.description]
        return jsonify({"status": "success", "columns": cols, "rows": rows})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()


# ============================================================
# EXECUTE QUERY
# ============================================================
@app.route('/execute-query', methods=['POST'])
def execute_query():
    payload = request.get_json() or {}
    query = payload.get("query", "").strip()
    username = payload.get("username")

    if not query:
        return jsonify({"status": "error", "message": "No query provided"}), 400

    banned = ["ATTACH", "DETACH"]
    if any(query.upper().startswith(b) for b in banned):
        return jsonify({"status": "error", "message": "This statement is not allowed"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        if query.lower().startswith("select"):
            cur.execute(query)
            rows = cur.fetchall()
            cols, data = serialize_rows(cur, rows)

            if username:
                save_history(username, query, conn)

            return jsonify({"status": "success", "columns": cols, "rows": data})

        else:
            cur.execute(query)
            conn.commit()

            affected = cur.rowcount if hasattr(cur, "rowcount") else None

            if username:
                save_history(username, query, conn)

            return jsonify({"status": "success", "message": "Query executed", "rows_affected": affected})

    except sqlite3.Error as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()


# ============================================================
# HISTORY TABLE
# ============================================================
def init_history():
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
    conn.close()


def save_history(username, query, conn=None):
    close = False
    if conn is None:
        conn = get_connection()
        close = True
    cur = conn.cursor()
    cur.execute("INSERT INTO QueryHistory (username, query, ts) VALUES (?, ?, ?)",
                (username, query, int(time.time())))
    conn.commit()
    if close:
        conn.close()


@app.route('/history', methods=['GET'])
def history():
    username = request.args.get("username")
    if not username:
        return jsonify({"status": "error", "message": "username required"}), 400
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT query, ts FROM QueryHistory WHERE username=? ORDER BY ts DESC LIMIT 100", (username,))
        rows = [{"query": r[0], "ts": r[1]} for r in cur.fetchall()]
        return jsonify({"status": "success", "history": rows})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()


# ============================================================
# USERS TABLE + SIGNUP + LOGIN
# ============================================================
def init_users():
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
    conn.close()


@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"status": "error", "message": "username and password required"}), 400

    if len(password) < 6:
        return jsonify({"status": "error", "message": "password must be at least 6 characters"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO Users (username, password_hash, created_ts) VALUES (?, ?, ?)",
                    (username, generate_password_hash(password), int(time.time())))
        conn.commit()
        return jsonify({"status": "success", "user": {"username": username}})
    except sqlite3.IntegrityError:
        return jsonify({"status": "error", "message": "username already exists"}), 400
    finally:
        conn.close()


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT password_hash FROM Users WHERE username=?", (username,))
        row = cur.fetchone()

        if not row or not check_password_hash(row["password_hash"], password):
            return jsonify({"status": "error", "message": "invalid credentials"}), 401

        return jsonify({"status": "success", "user": {"username": username}})
    finally:
        conn.close()


# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    init_users()
    init_history()
    app.run(host="0.0.0.0", port=5000, debug=True)
