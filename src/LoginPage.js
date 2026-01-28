import React, { useState } from "react";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Set the correct password in your .env file as REACT_APP_PASSWORD
    const correctPassword = process.env.REACT_APP_PASSWORD || "password";
    
    if (password === correctPassword) {
      setError("");
      onLogin();
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Email Reply Generator</h1>
        <p className="login-subtitle">Enter password to continue</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className="login-input"
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        
        <footer className="login-footer">
          <p className="footnote">
            Built by Kennedy-King College · Tech Launchpad
          </p>
        </footer>
      </div>
    </div>
  );
}
