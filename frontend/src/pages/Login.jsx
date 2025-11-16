import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import "./Login.css";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setErr("");

    if (!username || !password) return setErr("Enter username and password.");

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        return setErr(data.message || "Invalid credentials.");
      }

      // success
      login(username);
      navigate("/");
    } catch (error) {
      setLoading(false);
      setErr("Server unreachable.");
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card card">
        <h2 className="h1">
          Welcome back to <span style={{ color: "#2563eb" }}>SQL Query Engine</span>
        </h2>
        <p className="small">
          Run SQL queries against a sample DB — type, run, view results.
        </p>

        <form className="form" onSubmit={handle}>
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {err && <div className="error">{err}</div>}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
            <Link to="/signup" className="btn btn-ghost">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
