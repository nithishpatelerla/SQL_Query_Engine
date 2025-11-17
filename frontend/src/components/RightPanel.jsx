// src/components/RightPanel.jsx
import React, { useEffect, useState } from "react";
import BASE_URL from "../config"; 
import "../styles/RightPanel.css";

export default function RightPanel({ selectedTable }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedTable) {
      setInfo(null);
      return;
    }

    const fetchTableInfo = async () => {
      setLoading(true);

      try {
        const res = await fetch(`${BASE_URL}/table-info/${selectedTable}`);
        const data = await res.json();

        if (data.status === "success") {
          setInfo(data);
        }
      } catch (err) {
        console.error("Error fetching table info:", err);
      }

      setLoading(false);
    };

    fetchTableInfo();
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
          ) : loading ? (
            <p>Loading...</p>
          ) : info ? (
            <>
              {/* Schema Section */}
              <div className="schema-block">
                <div className="schema-title">📁 {selectedTable}</div>
                <ul className="schema-list">
                  {info.columns.map((c) => (
                    <li key={c.name}>
                      <strong>{c.name}</strong> [{c.type}]
                    </li>
                  ))}
                </ul>
              </div>

              <br />

              {/* Sample Rows Section */}
              <div className="schema-block">
                <div className="schema-title">📌 Table Rows</div>

                {info.sample.length > 0 ? (
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
            <p>No info available</p>
          )}
        </div>
      </div>
    </div>
  );
}
