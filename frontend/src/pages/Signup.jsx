import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import BASE_URL from "../config";


export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!/^[A-Za-z][A-Za-z0-9_.]{2,29}$/.test(username))
      return setErr(
        "Username: 3-30 chars, start with letter. Allowed: letters, digits, _ ."
      );

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password))
      return setErr("Password must be 8+ chars with upper, lower, digit.");

    if (captcha.trim().toLowerCase() !== "sql")
      return setErr('Captcha incorrect. Type "SQL".');

    try {
      const res = await fetch(`${BASE_URL}/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});

      const data = await res.json();

      if (!res.ok) {
        return setErr(data.message || "Signup failed.");
      }

      alert("Signup successful — please login.");
      navigate("/login");
    } catch (error) {
      setErr("Server unreachable.");
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card card">
        <h2 className="h1">Create account</h2>
        <p className="small">
          Set username, password and type <strong>SQL</strong> to verify.
        </p>

        <form className="form" onSubmit={submit}>
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

          <input
            className="input"
            placeholder='Type "SQL" to verify'
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
          />

          {err && <div className="error">{err}</div>}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <button className="btn btn-primary" type="submit">
              Sign Up
            </button>
            <Link to="/login" className="btn btn-ghost">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
