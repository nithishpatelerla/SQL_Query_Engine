// src/pages/MainPage.jsx
import React, { useState, useRef, useEffect, useContext } from "react";
import "../styles/MainPage.css";
import Sidebar from "../components/Sidebar";
import QueryRunner from "../components/QueryRunner";
import RightPanel from "../components/RightPanel";
import { AuthContext } from "../contexts/AuthContext";

export default function MainPage() {
  const { user, logout } = useContext(AuthContext);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [resetRunner, setResetRunner] = useState(false);

  // lifted state for query and history so logo can clear it
  const [query, setQuery] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  // tables list (Sidebar will notify parent)
  const [availableTables, setAvailableTables] = useState([]);

  // Refs for measuring panels
  const leftRef = useRef(null);
  const middleRef = useRef(null);
  const rightRef = useRef(null);

  // Dynamic button positions
  const [leftBtnX, setLeftBtnX] = useState(0);
  const [rightBtnX, setRightBtnX] = useState(0);

  // Update button positions with DOM measurements
  const updateButtonPositions = () => {
    const middleRect = middleRef.current?.getBoundingClientRect();
    const leftRect = leftRef.current?.getBoundingClientRect();
    const rightRect = rightRef.current?.getBoundingClientRect();

    if (middleRect) {
      setLeftBtnX(leftRect && leftOpen ? leftRect.right : middleRect.left);
      setRightBtnX(
        rightRect && rightOpen ? rightRect.left - 28 : middleRect.right - 28
      );
    }
  };

  useEffect(() => {
    updateButtonPositions();
  }, [leftOpen, rightOpen]);

  useEffect(() => {
    window.addEventListener("resize", updateButtonPositions);
    return () => window.removeEventListener("resize", updateButtonPositions);
  }, []);

  useEffect(() => {
    setTimeout(updateButtonPositions, 200);
  }, []);

  // LOGO click handler: close panels, clear query, close history
  const handleLogoClick = () => {
    setLeftOpen(false);
    setRightOpen(false);
    setQuery("");
    setHistoryOpen(false);
    setSelectedTable(null);
    setSelectedTable(null); // ✔ closes opened table
    setResetRunner(true); // NEW — tell QueryRunner to reset

    // small reposition after CSS transitions
    setTimeout(updateButtonPositions, 250);
  };

  return (
    <div className="main-page">
      {/* Header */}
      <div className="header glass">
        <div
          className="brand center"
          style={{ gap: 10, cursor: "pointer" }}
          onClick={handleLogoClick}
          title="SQLRunner — click to reset layout & clear editor"
        >
          <div className="logo-wrap" onClick={handleLogoClick}>
            <img src="/logo.png" alt="App Logo" className="logo-img" />
          </div>

          <div style={{ fontWeight: 700 }}>SQL Query Engine</div>
        </div>

        <div className="header-right">
          <span>Hello, {user?.username}</span>
          <button
            className="logout-btn"
            onClick={() => {
              logout();
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="layout-wrap">
        {/* LEFT PANEL */}
        <aside
          className={`left-col glass ${leftOpen ? "open" : "closed"}`}
          ref={leftRef}
        >
          <Sidebar onTablesChange={setAvailableTables} />

        </aside>

        {/* LEFT COLLAPSE BUTTON */}
        <button
          className="collapse-handle left-handle"
          style={{ left: leftBtnX, top: 140 }}
          onClick={() => {
            setLeftOpen(!leftOpen);
            setTimeout(updateButtonPositions, 300);
          }}
        >
          {leftOpen ? "<" : ">"}
        </button>

        {/* MIDDLE PANEL */}
        <aside className="middle-col glass" ref={middleRef}>
          <QueryRunner
            query={query}
            setQuery={setQuery}
            historyOpen={historyOpen}
            setHistoryOpen={setHistoryOpen}
            availableTables={availableTables}
            selectedTable={selectedTable}
            resetRunner={resetRunner}
          />
        </aside>

        {/* RIGHT COLLAPSE BUTTON */}
        <button
          className="collapse-handle right-handle"
          style={{ left: rightBtnX, top: 140 }}
          onClick={() => {
            setRightOpen(!rightOpen);
            setTimeout(updateButtonPositions, 300);
          }}
        >
          {rightOpen ? ">" : "<"}
        </button>

        {/* RIGHT PANEL */}
        <aside
          className={`right-col glass ${rightOpen ? "open" : "closed"}`}
          ref={rightRef}
        >
          <RightPanel
          selectedTable={selectedTable}
          tables={availableTables}
          onTableSelect={setSelectedTable}
          />
        </aside>
      </div>
    </div>
  );
}
