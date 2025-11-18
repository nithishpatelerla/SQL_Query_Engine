// src/components/RightPanel.jsx
import React, { useEffect, useState } from "react";
import BASE_URL from "../config";
import { FaFolder } from "react-icons/fa";
import { MdOutlinePushPin } from "react-icons/md";
import "../styles/RightPanel.css";

export default function RightPanel({
  selectedTable,
  tables = [],
  onTableSelect,
}) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedTable) {
      setInfo(null);
      return;
    }

    async function fetchTableInfo() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/table-info/${selectedTable}`);
        const data = await res.json();
        if (data.status === "success") setInfo(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }

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

          {/* SELECT A TABLE HINT */}
          {!selectedTable && (
            <p className="schema-hint">Select a table to view details</p>
          )}

          {/* TABLE LIST */}
          <div className="rp-table-list">
            {tables.map((t) => (
              <div
                key={t}
                className={`rp-table-item ${
                  selectedTable === t ? "active" : ""
                }`}
                onClick={() => onTableSelect(t)}
              >
                {t}
              </div>
            ))}
          </div>

          {/* SCHEMA DETAILS */}
          {selectedTable && (
            loading ? (
              <p>Loading...</p>
            ) : info ? (
              <>
                <div className="schema-block">
                  <div className="schema-title">
                    <FaFolder /> {selectedTable}
                  </div>
                  <ul className="schema-list">
                    {info.columns.map((c) => (
                      <li key={c.name}>
                        <strong>{c.name}</strong> [{c.type}]
                      </li>
                    ))}
                  </ul>
                </div>

                <br />

                <div className="schema-block">
                  <div className="schema-title">
                    <MdOutlinePushPin /> Table Rows
                  </div>

                  {info.sample.length > 0 ? (
                    <div className="schema-table-scroll">
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
                    </div>
                  ) : (
                    <p>No data</p>
                  )}
                </div>
              </>
            ) : (
              <p>No info available</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
