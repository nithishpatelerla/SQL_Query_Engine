// src/components/RightPanel.jsx
import React, { useEffect, useState } from "react";
import "../styles/RightPanel.css";

export default function RightPanel({ selectedTable }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!selectedTable) return;

    fetch(`http://localhost:5000/table-info/${selectedTable}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setInfo(data);
      });
  }, [selectedTable]);

  return (
    <div className="right-root">
      <div className="tabs">
        <input type="radio" name="rp-tab" id="rp-schema" defaultChecked />
        <div className="tabs-row">
          <label htmlFor="rp-schema" className="tab">
            Schema
          </label>
        </div>

        <div className="tab-content" id="rp-schema-content">
          {!selectedTable ? (
            <p>Select a table to view details</p>
          ) : info ? (
            <>
              <div className="schema-block">
                <div className="schema-title">📁 {selectedTable}</div>
                <ul className="schema-list">
                  {info.columns.map((c) => (
                    <li key={c.name}>
                      {c.name} [{c.type}]
                    </li>
                  ))}
                </ul>
              </div>
              <br />

              <div className="schema-block">
                <div className="schema-title">📌 Table Rows</div>
                {info.sample.length ? (
                  <table className="db-table">
                    <thead>
                      <tr>
                        {Object.keys(info.sample[0]).map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {info.sample.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((v, i) => (
                            <td key={i}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No data</p>
                )}
              </div>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}
