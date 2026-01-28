import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Inquiries from "./Inquiries";
import LoginPage from "./LoginPage";
import { supabase } from "./supabaseClient";

function Home({ onLogout }) {
  const navigate = useNavigate();
  //
  // 1. MASTER LISTS (what staff can pick in the form)
  //
  // We'll standardize the names so they match what you gave me.
  const programOptions = [
    "Cybersecurity",
    "Networking",
    "Software Development",
    "Game Design",
    "Cloud",
    "AI/Machine Learning",
    "Data Analytics",
    "Systems Administration"
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

  //
  // 2. CAMPUS → PROGRAMS THEY OFFER
  //
  // Based directly on what you sent:
  //
  // Richard J. Daley - Cyber, Networking, Soft Dev
  // Harold Washington - Cyber, Soft Dev
  // Kennedy-King - Cyber, Game Design, Networking, Soft Dev
  // Malcolm X - Cyber, Soft Dev
  // Olive-Harvey - Cyber, Networking, Soft Dev
  // Harry S Truman - Cyber, Cloud, Networking, Soft Dev
  // Wilbur Wright - Cyber, Cloud, Networking, Soft Dev
  //
  // We'll map those to our normalized program names:
  const campusCatalog = {
    "Richard J. Daley": [
      "Cybersecurity",
      "Networking",
      "Software Development",
    ],
    "Harold Washington": [
      "Cybersecurity",
      "Software Development",
    ],
    "Kennedy-King": [
      "Cybersecurity",
      "Game Design",
      "Networking",
      "Software Development",
    ],
    "Malcolm X": [
      "Cybersecurity",
      "Software Development",
    ],
    "Olive-Harvey": [
      "Cybersecurity",
      "Networking",
      "Software Development",
    ],
    "Harry S Truman": [
      "Cybersecurity",
      "Cloud",
      "Networking",
      "Software Development",
    ],
    "Wilbur Wright": [
      "Cybersecurity",
      "Cloud",
      "Networking",
      "Software Development",
    ],
    Undecided: [], // Treat as no specific campus match
  };

  const advisorDirectory = {
  "Richard J. Daley": {
    Credit: {
      name: "Cynthia Corral",
      email: "ccorral7@ccc.edu",
    },
    "Non-Credit": {
      name: "Nancy Cortes",
      email: "Ncortes18@ccc.edu",
    },
  },
  "Harold Washington": {
    Credit: {
      name: "Syliva Alvarado",
      email: "salvarado16@ccc.edu",
    },
    "Non-Credit": {
      name: "Leah Banks",
      email: "lbanks32@ccc.edu",
    },
  },
  "Kennedy-King": {
    Credit: {
      name: "Kira Humphrey",
      email: "khumphrey3@ccc.edu",
    },
    "Non-Credit": {
      name: "KKC CE",
      email: "kkcontinuinged@ccc.edu",
    },
  },
  "Malcolm X": {
    Credit: {
      name: "Troy Gore",
      email: "Tgore4@ccc.edu",
    },
    "Non-Credit": {
      name: "Perrin Greene",
      email: "pgreene3@ccc.edu",
    },
  },
  "Olive-Harvey": {
    Credit: {
      name: "Paris Parham",
      email: "pparham@ccc.edu",
    },
    "Non-Credit": {
      name: "Marcus Troutman",
      email: "mtroutman@ccc.edu",
    },
  },
  "Harry S Truman": {
    Credit: {
      name: "Michael Collins",
      email: "mcollins155@ccc.edu",
    },
    "Non-Credit": {
      name: "Laura Smith",
      email: "Lsmith3@ccc.edu",
    },
  },
  "Wilbur Wright": {
    Credit: {
      name: "Jesus Guzman",
      email: "jguzman389@ccc.edu",
    },
    "Non-Credit": {
      name: "Adam Kashuba",
      email: "akashuba@ccc.edu",
    },
  },
  // Fallback for "Undecided"
  Undecided: {
    Credit: {
      name: "Advising Team",
      email: "",
    },
    "Non-Credit": {
      name: "Advising Team",
      email: "",
    },
  },
};


  //
  // 3. FORM STATE
  //
  const [studentName, setStudentName] = useState("");
  const [program, setProgram] = useState(programOptions[0] || "");
  const [creditType, setCreditType] = useState("Credit");
  const [campus, setCampus] = useState(campusOptions[0] || "");
  const [studentContactEmail, setStudentContactEmail] = useState("");
  const [studentMessage, setStudentMessage] = useState("");

  //
  // 4. GENERATED EMAIL STATE
  //
  const [studentEmail, setStudentEmail] = useState("");
  const [advisorEmail, setAdvisorEmail] = useState("");
  const [generated, setGenerated] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null); // { text, type: 'success'|'error' }

  //
  // 5. HELPERS
  //
  function getTodayString() {
    const d = new Date();
    const month = d.toLocaleString("en-US", { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  function campusOffersProgram(campusName, programName) {
    const list = campusCatalog[campusName] || [];
    return list.includes(programName);
  }

  //
  // 6. EMAIL BUILDERS
  //
function buildStudentEmail({
  safeName,
  safeProgram,
  safeCampus,
  safeCreditType,
  offeredHere,
}) {
  // Special handling for AI/Machine Learning - not available at any campus
  if (safeProgram === "AI/Machine Learning") {
    if (safeCreditType === "Credit") {
      return `
Subject: Your Inquiry Has Been Received—CCC Technology Programs

Dear ${safeName},

Thank you for your interest in the CCC Center for Information Technologies! We're excited to help you explore technology programs at the City Colleges of Chicago.

Unfortunately we are not offering AI/Machine Learning credit courses until Fall 2026.

However, starting in March, we’re launching a 14-month Continuing Education Program on Machine Learning in collaboration with AWS. The program will be led by industry experts and designed to help you build practical skills. If you are interested feel free to reach out — we're here to help!

Best regards,
Tech@CCC.edu Team
      `.trim();
    } else {
      // Non-Credit
      return `
Subject: Your Inquiry Has Been Received—CCC Technology Programs

Dear ${safeName},

Thank you for your interest in the CCC Center for Information Technologies! We're excited to help you explore technology programs at the City Colleges of Chicago.

Starting in March, we will be launching a 14-month Continuing Education Program on Machine Learning in collaboration with AWS. The program will be led by industry experts and designed to help you build practical skills. If you are interested feel free to reach out — we're here to help!

Best regards,
Tech@CCC.edu Team
      `.trim();
    }
  }

  // Special handling for "Undecided" campus (non-AI programs)
  if (safeCampus === "Undecided") {
    // Show list of campuses that offer the selected program
    const campusesThatOffer = Object.entries(campusCatalog)
      .filter(([campusName, programs]) => 
        campusName !== "Undecided" && programs.includes(safeProgram)
      )
      .map(([campusName]) => campusName);
    
    const campusList = campusesThatOffer.length > 0 
      ? campusesThatOffer.join(", ")
      : "None currently";

    return `
Subject: Your Inquiry Has Been Received—CCC Technology Programs

Dear ${safeName},

Thank you for your interest in the CCC Center for Information Technologies! We're excited to help you explore technology programs at the City Colleges of Chicago.

Since you selected ${safeProgram} and are undecided on the Campus here are the schools that offer ${safeProgram}:

${campusList}

If you are interested feel free to reach out — we're here to help!

Best regards,
Tech@CCC.edu Team
    `.trim();
  }

  // Normal campus handling (not Undecided, not AI)
  if (offeredHere) {
    // Campus DOES offer that program
    return `
Subject: Your Inquiry Has Been Received—CCC Technology Programs

Dear ${safeName},

Thank you for your interest in the CCC Center for Information Technologies! We're excited to help you explore technology programs at the City Colleges of Chicago.

To best support you, we've forwarded your information to ${safeCampus} College. A representative from that campus will be reaching out to you shortly.

In the meantime, feel free to explore our programs here:
Academic Catalog:  https://catalog.ccc.edu/programs/#filter=.filter_3
CE Class Search:  https://apps.ccc.edu/scheduling/continuinged/

Best regards,
Tech@CCC.edu Team
    `.trim();
  } else {
    // Campus does NOT offer that program - show which campuses do
    const campusesThatOffer = Object.entries(campusCatalog)
      .filter(([campusName, programs]) => 
        campusName !== "Undecided" && programs.includes(safeProgram)
      )
      .map(([campusName]) => campusName);
    
    const campusList = campusesThatOffer.length > 0 
      ? campusesThatOffer.join(", ")
      : "None currently";

    return `
Subject: Your Inquiry Has Been Received—CCC Technology Programs

Dear ${safeName},

Thank you for your interest in the CCC Center for Information Technologies! We're excited to help you explore technology programs at the City Colleges of Chicago.

Unfortunately we are not offering ${safeProgram} at ${safeCampus}.

However, ${safeProgram} is offered at the following campuses:

${campusList}

If you have any questions or need help finding a program that fits your goals, feel free to reach out — we're here to help!

Best regards,
Tech@CCC.edu Team
    `.trim();
  }
}


 function buildAdvisorEmail({
  safeName,
  safeProgram,
  safeCreditType,
  safeCampus,
  offeredHere,
}) {
  // Look up advisor based on campus + credit type
  const advisor =
    advisorDirectory[safeCampus]?.[safeCreditType] || {
      name: `${safeCampus} Advising Team`,
      email: "",
    };

  // Build a "To:" line like:
  // To: Jane Smith <jsmith@ccc.edu>
  // or fallback to "To: Harold Washington Advising Team"
  const toLine = advisor.email
    ? `To: ${advisor.name} <${advisor.email}>`
    : `To: ${advisor.name}`;

  if (offeredHere) {
    // Program IS offered at this campus
    return `
${toLine}
Subject: Student Inquiry - ${safeProgram} (${safeCreditType}) | ${safeName}

Hello ${advisor.name},

A prospective student submitted interest in your ${safeProgram} program.

Please follow up as appropriate.

Best regards,
CoET Team
    `.trim();
  } else {
    // Program is NOT offered at this campus
    return `
${toLine}
Subject: Student Inquiry - ${safeProgram} (${safeCreditType}) | ${safeName}

Hello ${advisor.name},

A prospective student submitted interest in ${safeProgram} but selected ${safeCampus} as their preferred campus. Since ${safeProgram} is not offered at ${safeCampus}, we are sharing this inquiry for your awareness.

Best regards,
CoET Team
    `.trim();
  }
}


  //
  // 7. GENERATE HANDLER
  //
  async function handleGenerate(e) {
    e.preventDefault();

    const safeName = studentName.trim() || "Student";
    const safeProgram = program || "[Program / Pathway]";
    const safeCreditType = creditType || "[Credit Type]";
    const safeCampus = campus || "[Campus]";

    const offeredHere = campusOffersProgram(safeCampus, safeProgram);

    const studentTemplate = buildStudentEmail({
      safeName,
      safeProgram,
      safeCreditType,
      safeCampus,
      offeredHere,
    });

    // Persist the inquiry to the DB (or localStorage fallback)
    const entry = {
      name: safeName || "Student",
      email: studentContactEmail || "",
      message: studentMessage || "",
      program: safeProgram || "",
      campus: safeCampus || "",
      credit_type: safeCreditType || "",
      created_at: new Date().toISOString(),
    };

    let savedSuccessfully = false;
    if (supabase) {
      try {
        const { error } = await supabase.from("inquiries").insert([entry]).select();
        if (error) {
          console.error("Failed to save inquiry", error);
          savedSuccessfully = false;
        } else {
          savedSuccessfully = true;
        }
      } catch (err) {
        console.error("Error saving inquiry", err);
        savedSuccessfully = false;
      }
    } else {
      const STORAGE_KEY = "inquiries:v1";
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const newList = [entry, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      savedSuccessfully = true;
    }

    const advisorTemplate = buildAdvisorEmail({
      safeName,
      safeProgram,
      safeCreditType,
      safeCampus,
      offeredHere,
    });

    setStudentEmail(studentTemplate);
    setAdvisorEmail(advisorTemplate);
    setGenerated(true);

    // Show a temporary save confirmation
    if (savedSuccessfully) {
      setSaveMessage({ text: "Inquiry saved", type: "success" });
      // Clear the form inputs now that we've saved
      setStudentName("");
      setProgram(programOptions[0] || "");
      setCreditType("Credit");
      setCampus(campusOptions[0] || "");
      setStudentContactEmail("");
      setStudentMessage("");
    } else {
      setSaveMessage({ text: "Failed to save inquiry (see console)", type: "error" });
    }
    setTimeout(() => setSaveMessage(null), 3000);
  }

  //
  // 8. COPY HELPER
  //
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  //
  // 9. RENDER
  //
  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <h1 className="title">Email Reply Generator</h1>
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

      {saveMessage && (
        <div
          style={{
            margin: "12px auto",
            maxWidth: 980,
            padding: "10px 14px",
            borderRadius: 6,
            background: saveMessage.type === "success" ? "#e6ffed" : "#ffe6e6",
            color: saveMessage.type === "success" ? "#1a7f37" : "#a11d1d",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          {saveMessage.text}
        </div>
      )}

      <main className="main-grid">
        {/* LEFT: FORM */}
        <section className="card">
          <h2 className="section-title">Student Inquiry Form</h2>
          <form className="form-stack" onSubmit={handleGenerate}>
            {/* Student Name */}
            <div className="form-field">
              <label className="label" htmlFor="studentName">
                Student Name
              </label>
              <input
                id="studentName"
                className="input"
                placeholder="e.g. Jordan Smith"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            {/* Student Email */}
            <div className="form-field">
              <label className="label" htmlFor="studentContactEmail">
                Student Email
              </label>
              <input
                id="studentContactEmail"
                className="input"
                placeholder="student@example.edu"
                value={studentContactEmail}
                onChange={(e) => setStudentContactEmail(e.target.value)}
              />
            </div>

            {/* Program */}
            <div className="form-field">
              <label className="label" htmlFor="program">
                Program / Pathway of Interest
              </label>
              <select
                id="program"
                className="input"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              >
                {programOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Credit vs Non-Credit */}
            <div className="form-field">
              <label className="label">Credit Type</label>
              <div className="radio-row">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="creditType"
                    value="Credit"
                    checked={creditType === "Credit"}
                    onChange={(e) => setCreditType(e.target.value)}
                  />
                  <span>Credit</span>
                </label>

                <label className="radio-option">
                  <input
                    type="radio"
                    name="creditType"
                    value="Non-Credit"
                    checked={creditType === "Non-Credit"}
                    onChange={(e) => setCreditType(e.target.value)}
                  />
                  <span>Non-Credit</span>
                </label>
              </div>
            </div>

            {/* Campus */}
            <div className="form-field">
              <label className="label" htmlFor="campus">
                Campus Choice
              </label>
              <select
                id="campus"
                className="input"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
              >
                {campusOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="form-field">
              <label className="label">Message (optional)</label>
              <textarea
                className="input"
                placeholder="Any notes from the student"
                value={studentMessage}
                onChange={(e) => setStudentMessage(e.target.value)}
              />
            </div>

            <button type="submit" className="generate-btn">
              ⚡ Generate Emails
            </button>
          </form>
        </section>

        {/* RIGHT: RESULTS */}
        <section className="results-col">
          <h2 className="section-title">Draft Emails</h2>

          {!generated && (
            <div className="placeholder-card">
              <p className="placeholder-head">Nothing generated yet</p>
              <p className="placeholder-sub">
                Fill out the form and click “Generate Emails.”
              </p>
            </div>
          )}

          {generated && (
            <>
              {/* Student Email */}
              <div className="card">
                <div className="email-header">
                  <h3 className="email-title">Student Email Draft</h3>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(studentEmail)}
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  className="email-body"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                />
              </div>

              {/* Advisor Email */}
              <div className="card">
                <div className="email-header">
                  <h3 className="email-title">Advisor Email Draft</h3>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(advisorEmail)}
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  className="email-body"
                  value={advisorEmail}
                  onChange={(e) => setAdvisorEmail(e.target.value)}
                />
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        <p className="footnote">
          Built by Kennedy-King College · Tech Launchpad
        </p>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </footer>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user was previously authenticated
    const authStatus = localStorage.getItem("isAuthenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home onLogout={handleLogout} />} />
        <Route path="/inquiries" element={<Inquiries onLogout={handleLogout} />} />
      </Routes>
    </BrowserRouter>
  );
}
