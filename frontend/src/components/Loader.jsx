// src/components/Loader.jsx
import React from "react";
import "../components/Loader.css";

export default function Loader({ text }) {
  return (
    <div className="loader-overlay">
      <div className="spinner"></div>
      <div className="loader-text">{text || "Loading..."}</div>
    </div>
  );
}
