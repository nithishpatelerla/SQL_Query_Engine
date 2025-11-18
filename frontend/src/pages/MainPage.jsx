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

  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  const [selectedTable, setSelectedTable] = useState(null);
  const [query, setQuery] = useState("");

  const [availableTables, setAvailableTables] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [resetRunner, setResetRunner] = useState(false);

  // Refs for desktop collapse logic
  const leftRef = useRef(null);
  const middleRef = useRef(null);
  const rightRef = useRef(null);

  const [leftBtnX, setLeftBtnX] = useState(0);
  const [rightBtnX, setRightBtnX] = useState(0);

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

  const handleLogoClick = () => {
    setLeftOpen(false);
    setRightOpen(false);
    setQuery("");
    setHistoryOpen(false);
    setSelectedTable(null);
    setResetRunner(true);

    setTimeout(updateButtonPositions, 250);
  };

  return (
    <div className="main-page">

      {/* HEADER */}
      <div className="header glass">
        <div className="brand" onClick={handleLogoClick}>
          <img src="/logo.png" alt="Logo" className="logo-img" />
          <span>SQL Query Engine</span>
        </div>

        <div className="header-right">
          <span>Hello, {user.username}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* MOBILE BUTTONS */}
      <div className="mobile-buttons">
        <button className="mobile-btn" onClick={() => setMobileLeftOpen(true)}>📂 Tables</button>
        <button className="mobile-btn" onClick={() => setMobileRightOpen(true)}>📄 Schema</button>
      </div>

      {/* MAIN WRAPPER */}
      <div className="layout-wrap">

        {/* LEFT PANEL DESKTOP */}
        <aside
          className={`left-col glass ${leftOpen ? "open" : "closed"}`}
          ref={leftRef}
        >
          <Sidebar
            onTableSelect={setSelectedTable}
            onTablesChange={setAvailableTables}
          />
        </aside>

        {/* LEFT COLLAPSE BUTTON (Desktop only) */}
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

        {/* RIGHT COLLAPSE BUTTON DESKTOP */}
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

        {/* RIGHT PANEL DESKTOP */}
        <aside
          className={`right-col glass ${rightOpen ? "open" : "closed"}`}
          ref={rightRef}
        >
          <RightPanel selectedTable={selectedTable} />
        </aside>
      </div>

      {/* MOBILE SLIDE-IN PANELS */}

      {/* Mobile Sidebar */}
      <div className={`mobile-left-panel ${mobileLeftOpen ? "show" : ""}`}>
        <button className="close-mobile-btn" onClick={() => setMobileLeftOpen(false)}>Close</button>
        <Sidebar onTableSelect={setSelectedTable} />
      </div>

      {/* Mobile Schema */}
      <div className={`mobile-right-panel ${mobileRightOpen ? "show" : ""}`}>
        <button className="close-mobile-btn" onClick={() => setMobileRightOpen(false)}>Close</button>
        <RightPanel selectedTable={selectedTable} />
      </div>
    </div>
  );
}