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
  
  // NEW: mobile overlay open states
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  const [selectedTable, setSelectedTable] = useState(null);
  const [resetRunner, setResetRunner] = useState(false);

  const [query, setQuery] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const [availableTables, setAvailableTables] = useState([]);

  // collapse handle positions (desktop only)
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

  useEffect(() => { updateButtonPositions(); }, [leftOpen, rightOpen]);
  useEffect(() => {
    window.addEventListener("resize", updateButtonPositions);
    return () => window.removeEventListener("resize", updateButtonPositions);
  }, []);
  useEffect(() => { setTimeout(updateButtonPositions, 200); }, []);

  const handleLogoClick = () => {
    setLeftOpen(false);
    setRightOpen(false);
    setQuery("");
    setHistoryOpen(false);
    setSelectedTable(null);
    setResetRunner(true);

    setMobileLeftOpen(false);
    setMobileRightOpen(false);

    setTimeout(updateButtonPositions, 250);
  };

  const isMobile = window.innerWidth <= 1100;

  return (
    <div className="main-page">
      
      {/* Header */}
      <div className="header glass">
        <div
          className="brand center"
          style={{ gap: 10, cursor: "pointer" }}
          onClick={handleLogoClick}
        >
          <div className="logo-wrap">
            <img src="/logo.png" alt="App Logo" className="logo-img" />
          </div>
          <div style={{ fontWeight: 700 }}>SQL Query Engine</div>
        </div>

        <div className="header-right">
          <span>Hello, {user?.username}</span>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>


      {/* ======== MAIN LAYOUT ======== */}
      <div className="layout-wrap">

        {/* ================= MOBILE LEFT OVERLAY ================= */}
        {isMobile && (
          <>
            <div
              className={`mobile-overlay-left ${mobileLeftOpen ? "show" : ""}`}
            >
              <Sidebar
                onTableSelect={(t) => {
                  setSelectedTable(t);
                  setMobileLeftOpen(false);
                }}
                onTablesChange={setAvailableTables}
              />
            </div>

            {/* Left floating button */}
            <div
              className="mobile-float-left"
              onClick={() => setMobileLeftOpen(!mobileLeftOpen)}
            >
              {mobileLeftOpen ? "✖" : "<"}
            </div>
          </>
        )}

        {/* ================= MOBILE RIGHT OVERLAY ================= */}
        {isMobile && (
          <>
            <div
              className={`mobile-overlay-right ${mobileRightOpen ? "show" : ""}`}
            >
              <RightPanel selectedTable={selectedTable} />
            </div>

            {/* Right floating button */}
            <div
              className="mobile-float-right"
              onClick={() => setMobileRightOpen(!mobileRightOpen)}
            >
              {mobileRightOpen ? "✖" : ">"}
            </div>
          </>
        )}

        {/* ================= DESKTOP LEFT PANEL ================= */}
        {!isMobile && (
          <aside
            className={`left-col glass ${leftOpen ? "open" : "closed"}`}
            ref={leftRef}
          >
            <Sidebar
              onTableSelect={setSelectedTable}
              onTablesChange={setAvailableTables}
            />
          </aside>
        )}

        {/* Desktop left handle */}
        {!isMobile && (
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
        )}

        {/* ================= MIDDLE (QUERY RUNNER) ================= */}
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

        {/* ================= DESKTOP RIGHT HANDLE ================= */}
        {!isMobile && (
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
        )}

        {/* ================= DESKTOP RIGHT PANEL ================= */}
        {!isMobile && (
          <aside
            className={`right-col glass ${rightOpen ? "open" : "closed"}`}
            ref={rightRef}
          >
            <RightPanel selectedTable={selectedTable} />
          </aside>
        )}
      </div>
    </div>
  );
}
