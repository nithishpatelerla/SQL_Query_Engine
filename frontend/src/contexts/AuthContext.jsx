// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // <-- IMPORTANT

  useEffect(() => {
    const saved = localStorage.getItem("sqlrunner_user");

    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }
    const savedTheme = localStorage.getItem("sqlrunner_theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
    }

    setLoading(false); // <-- finished reading localStorage
  }, []);

  const login = (username) => {
    const u = { username };
    setUser(u);
    localStorage.setItem("sqlrunner_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sqlrunner_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
