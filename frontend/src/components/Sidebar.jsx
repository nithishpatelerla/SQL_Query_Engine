import React, { useEffect, useState } from "react";
import "../styles/Sidebar.css";

const BASE_URL = "https://sql-query-engine.onrender.com";

export default function Sidebar({ onTableSelect, onTablesChange }) {
  const [tables, setTables] = useState([]);
  const [tableData, setTableData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await fetch(`${BASE_URL}/tables`);
        const j = await res.json();
        if (j.status === "success") {
          const filtered = j.tables.filter(
            (name) => name !== "Users" && name !== "QueryHistory"
          );
          setTables(filtered);
          if (typeof onTablesChange === "function") onTablesChange(filtered);
        }
      } catch (err) {
        console.error("Error fetching tables:", err);
        if (typeof onTablesChange === "function") onTablesChange([]);
      }
    }
    fetchTables();
  }, [onTablesChange]);

  const fetchPreview = async (table) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/preview/${table}`);
      const j = await res.json();
      if (j.status === "success") {
        setTableData((prev) => ({ ...prev, [table]: j.rows }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    tables.forEach((t) => fetchPreview(t));
  }, [tables]);

  return (
    <div className="sidebar-root">
      <h4 className="small">Tables</h4>

      <div className="table-list">
        {tables.map((t) => (
          <div key={t} className="table-item" onClick={() => onTableSelect(t)}>
            {t}
          </div>
        ))}
      </div>

      <div className="preview-section">
        {tables.map((t) => (
          <div key={t} className="preview-block">
            <h5>{t} (preview)</h5>
            {tableData[t] ? (
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
                          <td key={j}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="small">Loading preview...</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
