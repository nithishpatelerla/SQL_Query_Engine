# SQL Query Engine — Full Stack SQL Query Execution Web App

SQL Query Engine is a full-stack application that allows users to:

- Create an account and log in
- Write and execute SQL queries
- View live query results directly from a SQLite database
- Explore tables dynamically using a sidebar
- View table schema and sample data
- Maintain a personal SQL execution history
- Use a clean, responsive UI built with React

---

## 🚀 Tech Stack

### **Frontend**
- React (JavaScript)
- React Router
- Context API (Authentication state)
- CSS (custom responsive layout)

### **Backend**
- Python
- Flask
- Flask-CORS
- SQLite3 (built-in database engine)

### **Database**
- SQLite database file: `sql_runner.db`
- Pre-loaded with tables such as:
  - `Customers`
  - `Orders`
  - `Shippings`

---

SQL_Query_Engine/
│
├── frontend/                  # React UI
│   ├── src/
│   │   ├── components/        # Login, Signup, Sidebar, QueryRunner, RightPanel, Loader
│   │   ├── pages/             # LoginPage, SignupPage, MainPage
│   │   ├── context/           # AuthContext
│   │   ├── styles/            # CSS files for premium UI
│   │   └── App.js
│   │
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/                   # Python FastAPI/Flask service
│   ├── app.py                 # Core API (execute queries, get tables, schema, history)
│   ├── requirements.txt       # Python dependencies
│   └── venv/                  # (Optional) Python virtual environment
│
└── sql_runner.db              # SQLite database


🔗 Connecting Frontend ↔ Backend

The React app calls the Flask API using endpoints:

POST /execute-query — Run SQL query

GET /tables — List all tables in database

GET /preview/<table> — Show first 5 rows

GET /table-info/<table> — Show schema + sample

GET /history?username=<u> — Get user’s SQL history
