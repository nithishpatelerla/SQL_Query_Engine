import React, {
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import "../styles/QueryRunner.css";
import { AuthContext } from "../context/AuthContext";
import ModalPortal from "./ModalPortal";
import { IoMdSunny } from "react-icons/io";
import { IoMoon } from "react-icons/io5";
import BASE_URL from "../config";           

export default function QueryRunner({
  query,
  setQuery,
  historyOpen,
  setHistoryOpen,
  availableTables = [],
  selectedTable,
  resetRunner,
}) {
  const { user } = useContext(AuthContext);
  const textareaRef = useRef();

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.body.classList.contains("dark")
  );

  // Load Query History
  useEffect(() => {
    async function loadHistory() {
      if (!user?.username) return;
      try {
        const res = await fetch(
          `${BASE_URL}/history?username=${encodeURIComponent(user.username)}`
        );
        const data = await res.json();

        if (data.status === "success") {
          setHistory(data.history.map((h) => h.query));
        }
      } catch (err) {
        console.error("Error loading history:", err);
      }
    }
    loadHistory();
  }, [user]);

  // Validate SQL Query
  const validateQuery = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return { ok: false, msg: "Query is empty" };
    if (!trimmed.endsWith(";")) {
      return {
        ok: false,
        msg: "SQL QUERY IS WRONG — missing semicolon ';'",
      };
    }

    const lowered = trimmed.toLowerCase();
    const tokens = lowered.replace(/[,();]/g, " ").split(/\s+/).filter(Boolean);

    const tableHints = [];
    for (let i = 0; i < tokens.length; i++) {
      if (["from", "join", "into", "update"].includes(tokens[i]) && tokens[i + 1]) {
        const name = tokens[i + 1].split(".").pop();
        tableHints.push(name);
      }
    }

    if (tableHints.length > 0 && availableTables.length > 0) {
      const lowerTables = availableTables.map((t) => t.toLowerCase());
      for (const t of tableHints) {
        if (!lowerTables.includes(t)) {
          return { ok: false, msg: `SQL QUERY IS WRONG — table "${t}" not found` };
        }
      }
    }

    if (!/\b(select|insert|update|delete|create|drop|alter|with)\b/i.test(trimmed)) {
      return { ok: false, msg: "SQL QUERY IS WRONG — unsupported operation" };
    }

    return { ok: true, msg: "" };
  };

  // Run SQL Query
  const runQuery = async () => {
    setError("");
    setResult(null);

    const { ok, msg } = validateQuery(query || "");
    if (!ok) {
      setError(msg);
      return;
    }

    setRunning(true);
    try {
      const res = await fetch(`${BASE_URL}/execute-query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          username: user?.username
        }),
      });
      const data = await res.json();

      if (data.status === "error") {
        setError(data.message || "Query failed");
      } else {
        setResult(data);
      }

      // Reload history after query execution
      if (user?.username) {
        try {
          const resH = await fetch(
            `${BASE_URL}/history?username=${encodeURIComponent(user.username)}`
          );
          const dH = await resH.json();
          if (dH.status === "success") {
            setHistory(dH.history.map((h) => h.query));
          }
        } catch {}
      }
    } catch (err) {
      setError("Server not reachable");
    }

    setRunning(false);
    setHistoryOpen(false);
  };

  // Keyboard Shortcuts
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runQuery();
    }
  };
  const handleKeyUp = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") runQuery();
  };

  // Theme toggle handler
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("sqlrunner_theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("sqlrunner_theme", "light");
    }
  }, [darkMode]);

  // Reset result when changing tables
  useEffect(() => {
    if (resetRunner) {
      setResult(null);
      setError("");
    }
  }, [resetRunner]);

  return (
    <div className="query-runner-root">
      {/* Top bar */}
      <div className="query-top">
        <div className="tabs-inline">
          <button className="small-tab" onClick={() => setInfoOpen(true)}>Info</button>
          <button className="small-tab" onClick={() => setTipsOpen(true)}>Tips</button>
        </div>

        <button
          className="theme-toggle pretty-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          <span className="icon">{darkMode ? <IoMdSunny /> : <IoMoon />}</span>
          <span className="label">{darkMode ? "Light" : "Dark"}</span>
        </button>
      </div>

      {/* SQL editor */}
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        placeholder="Write your SQL query here… (Enter to run)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      />

      {/* Buttons */}
      <div className="editor-actions">
        <button className="run-primary" onClick={runQuery} disabled={running}>
          {running ? "Running…" : "▶ Run SQL"}
        </button>

        <div className="history-wrapper">
          <button className="run-primary alt" onClick={() => setHistoryOpen(!historyOpen)}>
            ⏳ History
          </button>

          {historyOpen && (
            <div className="history-dropdown card">
              {history.length === 0 ? (
                <div className="small">No history</div>
              ) : (
                history.map((h, i) => (
                  <div
                    key={i}
                    className="history-item"
                    onClick={() => setQuery(h)}
                  >
                    {h}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="output-area">
        {error && <p className="error">{error}</p>}

        {result?.rows && (
          <div className="result-table-wrap">
            <table className="output-table">
              <thead>
                <tr>
                  {result.columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {result.rows.map((row, idx) => (
                  <tr key={idx}>
                    {result.columns.map((col) => (
                      <td key={col}>
                        {String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!result?.rows && result?.message && (
          <p className="success-msg">
            {result.message} (Rows affected: {result.rows_affected})
          </p>
        )}
      </div>
    </div>
  );
}
