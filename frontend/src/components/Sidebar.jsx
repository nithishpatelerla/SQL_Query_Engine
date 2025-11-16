// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import "../styles/Sidebar.css";

export default function Sidebar({ onTableSelect, onTablesChange }) {
  const [tables, setTables] = useState([]);
  const [tableData, setTableData] = useState({}); // { tableName: rows }
  const [loading, setLoading] = useState(false);

  // Fetch list of tables
  useEffect(() => {
    fetch("http://localhost:5000/tables")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const filtered = data.tables.filter(
            (name) => name !== "Users" && name !== "QueryHistory"
          );
          setTables(filtered);
          if (typeof onTablesChange === "function") onTablesChange(filtered);
        }
      })
      .catch(() => {
        if (typeof onTablesChange === "function") onTablesChange([]);
      });
  }, [onTablesChange]);

  // Fetch preview rows when each table appears
  const fetchPreview = async (table) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/preview/${table}`);
      const data = await res.json();
      if (data.status === "success") {
        setTableData((prev) => ({
          ...prev,
          [table]: data.rows,
        }));
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Fetch preview for all tables once loaded
  useEffect(() => {
    tables.forEach((t) => fetchPreview(t));
  }, [tables]);

  return (
    <div className="sidebar-root">
      {tables.map((t) => (
        <div className="sidebar-section" key={t}>
          <h3 onClick={() => onTableSelect(t)} style={{ cursor: "pointer" }}>
            {t}
          </h3>

          <div className="table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  {tableData[t] &&
                    Object.keys(tableData[t][0] || {}).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {tableData[t] ? (
                  tableData[t].map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, i) => (
                        <td key={i}>{val}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>Loading...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
