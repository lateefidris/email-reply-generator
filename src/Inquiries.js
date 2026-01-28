import React, { useEffect, useMemo, useState } from "react";
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

export default function Inquiries({ onLogout }) {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({ program: "", campus: "", creditType: "", q: "" });
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

 // function handleFilterChange(e) {
//   setFilters({ ...filters, [e.target.name]: e.target.value });
// }


  function summarizeByCampusAndProgram(items) {
    const out = {};
    items.forEach((it) => {
      const campus = it.campus || "Undecided";
      const program = it.program || "Other";
      out[campus] = out[campus] || {};
      out[campus][program] = (out[campus][program] || 0) + 1;
    });
    return out;
  }

  function MiniBarChart({ data }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    const width = 420;
    const labelWidth = 140;
    const paddingRight = 30;
    const maxBarWidth = width - labelWidth - paddingRight;
    const barHeight = 18;
    const rowGap = 8;

    return (
      <svg width={width} height={data.length * (barHeight + rowGap)}>
        {data.map((d, idx) => {
          const w = Math.round((d.value / max) * maxBarWidth);
          const y = idx * (barHeight + rowGap);
          const barX = labelWidth;
          let valueX = barX + w + 8;
          let valueInside = false;
          if (valueX > width - 12) {
            // place value inside the bar if it would overflow
            valueInside = true;
            valueX = barX + Math.max(8, w - 8);
          }
          return (
            <g key={d.label} transform={`translate(0, ${y})`}>
              <text x={0} y={barHeight - 4} fontSize={12} fill="#fff">{d.label}</text>
              <rect x={barX} y={0} width={w} height={barHeight} fill="#007acc" rx={3} />
              <text x={valueX} y={barHeight - 4} fontSize={12} fill={valueInside ? "#fff" : "#fff"}>{d.value}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  function FiltersList({ items }) {
    const [localFilters, setLocalFilters] = React.useState(filters);

    useEffect(() => {
      setLocalFilters(filters);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.program, filters.campus, filters.creditType, filters.q]);

    function onLocalChange(e) {
      const next = { ...localFilters, [e.target.name]: e.target.value };
      setLocalFilters(next);
      setFilters(next);
    }

    const filtered = useMemo(() => {
      return items.filter((i) => {
        if (localFilters.program && i.program !== localFilters.program) return false;
        if (localFilters.campus && i.campus !== localFilters.campus) return false;
        const creditVal = i.credit_type || i.creditType || "";
        if (localFilters.creditType && creditVal !== localFilters.creditType) return false;
        if (localFilters.q) {
          const q = localFilters.q.toLowerCase();
          const hay = `${i.name} ${i.email} ${i.message} ${i.program} ${i.campus}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }, [items, localFilters]);

    // group by campus
    const byCampus = useMemo(() => {
      const out = {};
      filtered.forEach((it) => {
        const campus = it.campus || "Undecided";
        out[campus] = out[campus] || [];
        out[campus].push(it);
      });
      return out;
    }, [filtered]);

    function copyEmailsForCampus(e, camp) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch (err) {}
      const arr = (byCampus[camp] || []).map((it) => it.email || "").filter(Boolean);
      const unique = Array.from(new Set(arr));
      const text = unique.join('\n');
      if (!text) {
        alert(`No emails to copy for ${camp}`);
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          alert(`Copied ${unique.length} email(s) from ${camp}`);
        }, () => {
          fallbackCopy(text, camp, unique.length);
        });
      } else {
        fallbackCopy(text, camp, unique.length);
      }
    }

    function fallbackCopy(text, camp, count) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        alert(`Copied ${count} email(s) from ${camp}`);
      } catch (err) {
        alert('Unable to copy to clipboard');
      }
      document.body.removeChild(ta);
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ margin: 0 }}>Inquiries List</h1>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label className="label">Program</label>
              <select name="program" value={localFilters.program} onChange={onLocalChange} className="input">
                <option value="">All</option>
                {programOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Campus</label>
              <select name="campus" value={localFilters.campus} onChange={onLocalChange} className="input">
                <option value="">All</option>
                {campusOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Credit</label>
              <select name="creditType" value={localFilters.creditType} onChange={onLocalChange} className="input">
                <option value="">All</option>
                {creditOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="label">Search</label>
              <input name="q" value={localFilters.q} onChange={onLocalChange} placeholder="name, email, message…" className="input" />
            </div>
          </div>
        </div>

        {/* Campus accordions: show campus summary only until opened */}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {Object.keys(byCampus).length === 0 && <p>No matching inquiries.</p>}
          {Object.keys(byCampus).map((camp) => (
            <li key={camp} style={{ marginBottom: 8 }}>
              <details className="card" style={{ padding: 12 }}>
                <summary style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <strong style={{ color: '#fff' }}>{camp}</strong>
                    <button
                      onMouseDown={(e) => { try { e.preventDefault(); e.stopPropagation(); } catch (err) {} }}
                      onClick={(e) => copyEmailsForCampus(e, camp)}
                      title={`Copy emails for ${camp}`}
                      style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
                    >
                      📋
                    </button>
                  </div>
                  <div style={{ color: '#fff' }}>{byCampus[camp].length}</div>
                </summary>
                <div style={{ marginTop: 8 }}>
                  <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                    {byCampus[camp].map((i, idx) => (
                      <li key={i.id || i.created_at || idx} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <strong style={{ color: '#fff' }}>{i.name}</strong>
                            <div style={{ fontSize: 13, color: '#fff' }}>{i.email}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: '#fff' }}>{new Date(i.created_at).toLocaleString()}</div>
                            <div style={{ fontSize: 12, color: '#fff' }}>{i.program} • {i.credit_type || i.creditType || ''}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 8, color: '#fff' }}>{i.message}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function Breakdown({ items }) {
    const summary = useMemo(() => summarizeByCampusAndProgram(items), [items]);
    const totals = useMemo(() => {
      const out = {};
      Object.keys(summary).forEach((camp) => {
        out[camp] = Object.values(summary[camp]).reduce((s, v) => s + v, 0);
      });
      return out;
    }, [summary]);

    return (
      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Campus — Program Breakdown</h3>
        {items.length === 0 && <p>No data to display.</p>}
        {items.length > 0 && Object.keys(summary).map((camp) => {
          const programs = Object.entries(summary[camp]).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value);
          return (
            <div key={camp} style={{ marginBottom: 14 }}>
              <strong style={{ display: 'block', marginBottom: 6, color: '#fff' }}>{camp} — Total: {totals[camp]}</strong>
              <MiniBarChart data={programs} />
            </div>
          );
        })}
      </div>
    );
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
          <Breakdown items={list} />

          {loading && <p>Loading…</p>}
          {!loading && list.length === 0 && <p>No inquiries yet.</p>}

          <FiltersList items={list} />
        </section>
      </main>
    </div>
  );
}
