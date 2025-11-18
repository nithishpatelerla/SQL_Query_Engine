// src/components/Sidebar.jsx
import React, { useEffect, useState, useRef } from "react";
import "../styles/Sidebar.css";
import BASE_URL from "../config";

export default function Sidebar({ onTablesChange }) {
  const [tables, setTables] = useState([]);
  const [tableData, setTableData] = useState({});
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const ctrl = new AbortController();

    async function fetchTables() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/tables`, { signal: ctrl.signal });
        const j = await res.json();

        if (!mountedRef.current) return;
        if (j && j.status === "success" && Array.isArray(j.tables)) {
          const filtered = j.tables.filter(
            (name) => name !== "Users" && name !== "QueryHistory"
          );
          setTables(filtered);
          if (typeof onTablesChange === "function") {
            try {
              onTablesChange(filtered);
            } catch (e) {
              // don't let parent's errors break sidebar
              console.error("onTablesChange threw:", e);
            }
          }
        } else {
          setTables([]);
          if (typeof onTablesChange === "function") onTablesChange([]);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          // request was cancelled - ignore
        } else {
          console.error("Error fetching tables:", err);
          if (typeof onTablesChange === "function") onTablesChange([]);
          setTables([]);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    fetchTables();

    return () => {
      mountedRef.current = false;
      ctrl.abort();
    };
  }, [onTablesChange]);

  useEffect(() => {
    // fetch previews for all tables (batched)
    if (!tables || tables.length === 0) return;

    const ctrl = new AbortController();
    let cancelled = false;

    async function loadPreviews() {
      try {
        const promises = tables.map(async (table) => {
          try {
            const res = await fetch(`${BASE_URL}/preview/${table}`, {
              signal: ctrl.signal,
            });
            const j = await res.json();
            if (j && j.status === "success" && Array.isArray(j.rows)) {
              return { table, rows: j.rows };
            }
            return { table, rows: [] };
          } catch (e) {
            if (e.name === "AbortError") return { table, rows: [] };
            console.error(`Preview fetch error for ${table}:`, e);
            return { table, rows: [] };
          }
        });

        const results = await Promise.all(promises);
        if (cancelled) return;

        const map = {};
        for (const r of results) {
          map[r.table] = r.rows;
        }
        if (mountedRef.current) setTableData(map);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Error loading previews:", err);
      }
    }

    loadPreviews();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [tables]);

  return (
    <div className="sidebar-root">
      <h4 className="small">Table Previews</h4>

      {loading ? (
        <div className="small">Loading tables…</div>
      ) : tables.length === 0 ? (
        <div className="small">No tables available</div>
      ) : (
        <div className="preview-section">
          {tables.map((t) => (
            <div key={t} className="preview-block">
              <h5>{t} (preview)</h5>

              {Array.isArray(tableData[t]) && tableData[t].length > 0 ? (
                <div className="preview-scroll">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {Object.keys(tableData[t][0] || {}).map((c) => (
                          <th key={c}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData[t].map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, j) => (
                            <td key={j}>{String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="small">No preview data</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
