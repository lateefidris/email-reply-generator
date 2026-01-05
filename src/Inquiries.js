import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "inquiries:v1";

const programOptions = [
  "Cybersecurity",
  "Networking",
  "Software Development",
  "Game Design",
  "Cloud",
  "AI/Machine Learning",
  "Data Analytics",
  "Systems Administration",
];

const campusOptions = [
  "Richard J. Daley",
  "Harold Washington",
  "Kennedy-King",
  "Malcolm X",
  "Olive-Harvey",
  "Harry S Truman",
  "Wilbur Wright",
  "Undecided",
];

const creditOptions = ["Credit", "Non-Credit"];

export default function Inquiries() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "", program: programOptions[0], campus: campusOptions[0], creditType: creditOptions[0] });

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("inquiries")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setList(data || []);
      } else {
        const raw = localStorage.getItem(STORAGE_KEY);
        setList(raw ? JSON.parse(raw) : []);
      }
    } catch (err) {
      console.error("Failed to fetch inquiries", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const entry = {
      name: form.name || "Anonymous",
      email: form.email || "",
      message: form.message || "",
      program: form.program || "",
      campus: form.campus || "",
      credit_type: form.creditType || "",
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { error } = await supabase.from("inquiries").insert([entry]);
      if (error) {
        console.error(error);
        alert("Failed to save inquiry (see console)");
        return;
      }
      setForm({ name: "", email: "", message: "", program: programOptions[0], campus: campusOptions[0], creditType: creditOptions[0] });
      fetchList();
    } else {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const newList = [entry, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      setList(newList);
      setForm({ name: "", email: "", message: "", program: programOptions[0], campus: campusOptions[0], creditType: creditOptions[0] });
    }
  }

  async function handleClear() {
    if (supabase) {
      const { error } = await supabase.from("inquiries").delete().neq("id", "");
      if (error) console.error(error);
      fetchList();
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setList([]);
    }
  }

  function getTodayString() {
    const d = new Date();
    const month = d.toLocaleString("en-US", { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
  }


  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <h1 className="title">Inquiries</h1>
              <p className="tagline">City College of Chicago · CoET</p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="generate-btn" onClick={() => navigate('/')}>Generator</button>
              <button type="button" className="generate-btn" onClick={() => navigate('/inquiries')}>Inquiries</button>
            </div>
          </div>
        </div>
        <div className="date-pill">{getTodayString()}</div>
      </header>

      <main className="main-grid">
       
        <section className="card">
          <h2 className="section-title">Add Inquiry</h2>
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="label">Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="input" />
            </div>

            <div className="form-field">
              <label className="label">Email</label>
              <input name="email" value={form.email} onChange={handleChange} className="input" />
            </div>

            <div className="form-field">
              <label className="label">Program / Pathway</label>
              <select name="program" value={form.program} onChange={handleChange} className="input">
                {programOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="label">Campus</label>
              <select name="campus" value={form.campus} onChange={handleChange} className="input">
                {campusOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="label">Credit Type</label>
              <select name="creditType" value={form.creditType} onChange={handleChange} className="input">
                {creditOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="label">Message</label>
              <textarea name="message" value={form.message} onChange={handleChange} className="input" />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="generate-btn">Save Inquiry</button>
              <button type="button" onClick={handleClear} className="copy-btn">Clear All</button>
            </div>
          </form>
        </section>

        <section className="results-col">
          <h2 className="section-title">Entries</h2>
          {loading && <p>Loading…</p>}
          {!loading && list.length === 0 && <p>No inquiries yet.</p>}
          <ul>
            {list.map((i, idx) => (
              <li key={i.id || i.created_at || idx} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{i.name}</strong>
                  <span style={{ fontSize: 12, color: "#666" }}>{new Date(i.created_at).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 13 }}>{i.email} • {i.program} • {i.campus} • {i.credit_type || i.creditType || ""}</div>
                <p>{i.message}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
