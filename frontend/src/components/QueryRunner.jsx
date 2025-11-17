// src/components/QueryRunner.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import "../styles/QueryRunner.css";
import { AuthContext } from "../contexts/AuthContext";
import ModalPortal from "../components/ModalPortal";
import { IoMdSunny } from "react-icons/io";
import { IoMoon } from "react-icons/io5";


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

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const textareaRef = useRef();

  useEffect(() => {
    async function loadHistory() {
      if (!user || !user.username) return;
      try {
        const res = await fetch(
          `http://localhost:5000/history?username=${encodeURIComponent(
            user.username
          )}`
        );
        const data = await res.json();
        if (data.status === "success") {
          setHistory(data.history.map((h) => h.query));
        }
      } catch {}
    }
    loadHistory();
  }, [user]);

  // basic client-side SQL validation
  const validateQuery = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return { ok: false, msg: "Query is empty" };

    // require ending semicolon
    if (!trimmed.endsWith(";")) {
      return {
        ok: false,
        msg: "SQL QUERY IS WRONG — please terminate statements with a semicolon ';'.",
      };
    }

    // find table names after FROM / JOIN / INTO (very light heuristic)
    const lowered = trimmed.toLowerCase();
    const tokens = lowered
      .replace(/[,();]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    const tableHints = [];
    for (let i = 0; i < tokens.length; i++) {
      if (
        tokens[i] === "from" ||
        tokens[i] === "join" ||
        tokens[i] === "into" ||
        tokens[i] === "update"
      ) {
        if (tokens[i + 1]) {
          // remove possible alias or schema prefix
          const name = tokens[i + 1].split(".").pop();
          tableHints.push(name);
        }
      }
    }

    // if we found hints, ensure they exist in availableTables (case-insensitive)
    if (
      tableHints.length > 0 &&
      availableTables &&
      availableTables.length > 0
    ) {
      const lowerTables = availableTables.map((t) => t.toLowerCase());
      for (const tname of tableHints) {
        if (!lowerTables.includes(tname)) {
          return {
            ok: false,
            msg: `SQL QUERY IS WRONG — referenced table "${tname}" not found. Use an existing table name.`,
          };
        }
      }
    }

    // basic sanity: must contain a recognized SQL keyword
    if (
      !/\b(select|insert|update|delete|create|drop|alter|with)\b/i.test(trimmed)
    ) {
      return {
        ok: false,
        msg: "SQL QUERY IS WRONG — unrecognized or unsupported statement.",
      };
    }

    return { ok: true, msg: "" };
  };

  const runQuery = async () => {
    setError("");
    setResult(null);

    const validation = validateQuery(query || "");
    if (!validation.ok) {
      setError(validation.msg);
      return;
    }

    setRunning(true);
    try {
      const res = await fetch("http://localhost:5000/execute-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, username: user?.username }),
      });

      const data = await res.json();
      if (data.status === "error") {
        setError(data.message || "Query failed");
      } else {
        setResult(data);
      }

      // refresh history from server
      if (user?.username) {
        try {
          const resHistory = await fetch(
            `http://localhost:5000/history?username=${encodeURIComponent(
              user.username
            )}`
          );
          const dataHistory = await resHistory.json();
          if (dataHistory.status === "success") {
            setHistory(dataHistory.history.map((h) => h.query));
          }
        } catch {}
      }
    } catch (err) {
      setError("Backend not reachable");
    }
    setRunning(false);
  };

  // keyboard: Enter runs (Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runQuery();
    }
  };

  // keyboard shortcut: Ctrl/Cmd+Enter also runs
  const handleKeyUp = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      runQuery();
    }
  };

  // small helper to render output text safely with wrapping
  const renderErrorMessage = (msg) => {
    return (
      <div
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {msg}
      </div>
    );
  };
  const [darkMode, setDarkMode] = useState(
    document.body.classList.contains("dark")
  );

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("sqlrunner_theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("sqlrunner_theme", "light");
    }
  }, [darkMode]);
  useEffect(() => {
    if (resetRunner) {
      setResult(null);
      setError("");
    }
  }, [resetRunner]);

  return (
    <div className="query-runner-root">
      <div className="query-top">
        <div className="tabs-inline">
          <button className="small-tab" onClick={() => setInfoOpen(true)}>
            Info
          </button>
          <button className="small-tab" onClick={() => setTipsOpen(true)}>
            Tips
          </button>
          {infoOpen && (
            <ModalPortal>
              <div className="modal-overlay" onClick={() => setInfoOpen(false)}>
                <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                  <h3>ℹ️ How to Use SQLRunner</h3>
                  <ul>
                    <li>Use &lt; and &gt; buttons to collapse side panels.</li>
                    <li>Click SQLRunner logo to reset layout.</li>
                    <li>Press Enter to run query.</li>
                    <li>Shift+Enter for new line.</li>
                    <li>Ctrl/Cmd+Enter runs instantly.</li>
                    <li>History dropdown stores your queries.</li>
                  </ul>
                  <button
                    className="modal-close"
                    onClick={() => setInfoOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </ModalPortal>
          )}

          {tipsOpen && (
            <ModalPortal>
              <div className="modal-overlay" onClick={() => setTipsOpen(false)}>
                <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                  <h3>💡 SQL Tips</h3>
                  <ul>
                    <li>End SQL queries with a semicolon (;).</li>
                    <li>Table names must match exactly.</li>
                    <li>Use WHERE to filter rows.</li>
                    <li>Use ORDER BY for sorting.</li>
                    <li>Use LIMIT to restrict rows.</li>
                  </ul>
                  <button
                    className="modal-close"
                    onClick={() => setTipsOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </ModalPortal>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="theme-toggle pretty-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            <span className="icon">{darkMode ? <IoMdSunny /> : <IoMoon />}</span>
            <span className="label">{darkMode ? "Light" : "Dark"}</span>
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="editor-textarea"
        placeholder="Write your SQL query here... (press Enter to run, Shift+Enter for newline)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      />

      <div className="editor-actions">
        <button className="run-primary" onClick={runQuery} disabled={running}>
          {running ? "Running..." : "▶ Run SQL"}
        </button>

        <div className="history-wrapper">
          <button
            className="run-primary alt"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            ⏳ History
          </button>

          {historyOpen && (
            <div className="history-dropdown" style={{ position: "absolute" }}>
              {history.length === 0 ? (
                <div className="history-empty">No history</div>
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

      <div className="output-area">
        {error && <p style={{ color: "red" }}>{renderErrorMessage(error)}</p>}

        {result?.rows && (
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
                    <td
                      key={col}
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {result?.message && !result.rows && (
          <p style={{ color: "green", wordBreak: "break-word" }}>
            {result.message} (Rows affected: {result.rows_affected})
          </p>
        )}
      </div>
    </div>
  );
}
