"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";

type Role = "doctor" | "food";

const ROLES: { value: Role; label: string; icon: string; email: string }[] = [
  { value: "doctor", label: "Doctor", icon: "🩺", email: "doctor@supacare.health" },
  { value: "food", label: "Food Admin", icon: "🍽️", email: "food@supacare.health" },
];

const DEMO_PASSWORD = "unihack2026";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => emailRef.current?.focus(), 400);
  }, []);

  const fillDemo = (role: Role) => {
    const r = ROLES.find(r => r.value === role);
    if (!r) return;
    setSelectedRole(role);
    setEmail(r.email);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push(from);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green:       #52B788;
          --green-dark:  #2D6A4F;
          --green-deep:  #1C2B22;
          --green-mid:   #0F6E56;
          --teal-light:  #E1F5EE;
          --cream:       #F9F6F1;
          --border:      #E5E0D6;
          --border-deep: #D0C8BA;
          --text:        #1A1A18;
          --text-mid:    #6B6860;
          --text-hint:   #A8A59F;
          --white:       #ffffff;
          --red:         #A32D2D;
          --red-light:   #FCEBEB;
        }
        .login-root {
          min-height: 100vh; display: flex;
          background: var(--cream);
          font-family: 'DM Sans', sans-serif;
          color: var(--text); overflow: hidden;
          width: 100%;
        }

        /* ── Left branding panel ── */
        .left-panel {
          display: none; flex-direction: column; justify-content: space-between;
          width: 420px; flex-shrink: 0;
          background: var(--green-deep);
          padding: 48px 40px; position: relative; overflow: hidden;
        }
        @media (min-width: 900px) { .left-panel { display: flex; } }
        .lbc { position:absolute; border-radius:50%; background:rgba(82,183,136,0.07); pointer-events:none; }
        .lbc-1 { width:340px; height:340px; top:-80px; right:-100px; }
        .lbc-2 { width:220px; height:220px; bottom:60px; left:-60px; }
        .lbc-3 { width:140px; height:140px; top:50%; left:60px; }

        .left-logo { display:flex; align-items:center; gap:11px; position:relative; z-index:1; }
        .left-logo-mark {
          width:40px; height:40px; background:var(--green); border-radius:12px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .left-logo-name { font-family:'Fraunces',serif; font-size:20px; font-weight:500; color:#fff; }
        .left-logo-name span { color:var(--green); }

        .left-tagline { position:relative; z-index:1; }
        .left-tagline-eyebrow {
          font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase;
          color:rgba(82,183,136,0.6); margin-bottom:14px;
        }
        .left-tagline-title {
          font-family:'Fraunces',serif; font-size:34px; font-weight:500;
          color:#fff; line-height:1.2; margin-bottom:16px;
        }
        .left-tagline-title em { font-style:italic; color:var(--green); }
        .left-tagline-body { font-size:13px; color:rgba(255,255,255,0.45); line-height:1.7; max-width:280px; }

        .left-features { position:relative; z-index:1; display:flex; flex-direction:column; gap:12px; }
        .left-feature { display:flex; align-items:center; gap:10px; font-size:12px; color:rgba(255,255,255,0.45); }
        .left-feature-dot { width:6px; height:6px; border-radius:50%; background:var(--green); flex-shrink:0; opacity:0.7; }

        /* ── Demo credentials card (left panel bottom) ── */
        .demo-card {
          position:relative; z-index:1;
          background:rgba(82,183,136,0.08);
          border:1px solid rgba(82,183,136,0.18);
          border-radius:10px; padding:14px 16px;
        }
        .demo-card-label {
          font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;
          color:rgba(82,183,136,0.55); margin-bottom:10px;
        }
        .demo-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:6px 0; border-bottom:1px solid rgba(82,183,136,0.1);
        }
        .demo-row:last-child { border-bottom:none; padding-bottom:0; }
        .demo-role { display:flex; align-items:center; gap:7px; }
        .demo-role-icon { font-size:13px; }
        .demo-role-name { font-size:11px; font-weight:600; color:rgba(255,255,255,0.7); }
        .demo-email { font-size:10px; color:rgba(255,255,255,0.35); font-family:monospace; }
        .demo-pw {
          font-size:10px; font-weight:600; letter-spacing:0.04em;
          color:var(--green); background:rgba(82,183,136,0.12);
          border:1px solid rgba(82,183,136,0.2); border-radius:4px; padding:2px 7px;
        }

        /* ── Right / form side ── */
        .right-panel {
          flex:1; display:flex; align-items:center; justify-content:center;
          padding:32px 24px; overflow-y:auto;
        }
        .form-shell {
          width:100%; max-width:400px;
          display:flex; flex-direction:column; gap:0;
          opacity:0; transform:translateY(16px);
          transition:opacity 0.5s ease, transform 0.5s ease;
        }
        .form-shell.visible { opacity:1; transform:translateY(0); }

        /* Mobile logo */
        .mobile-logo { display:flex; align-items:center; gap:10px; margin-bottom:36px; }
        @media (min-width:900px) { .mobile-logo { display:none; } }
        .mobile-logo-mark {
          width:36px; height:36px; background:var(--green-deep); border-radius:10px;
          display:flex; align-items:center; justify-content:center;
        }
        .mobile-logo-name { font-family:'Fraunces',serif; font-size:18px; font-weight:500; color:var(--text); }
        .mobile-logo-name span { color:var(--green); }

        /* Mobile demo credentials */
        .mobile-demo {
          display:flex; flex-direction:column; gap:6px;
          background:#fff; border:1px solid var(--border); border-radius:10px;
          padding:12px 14px; margin-bottom:24px;
        }
        @media (min-width:900px) { .mobile-demo { display:none; } }
        .mobile-demo-label {
          font-size:9px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
          color:var(--text-hint); margin-bottom:4px;
        }
        .mobile-demo-row {
          display:flex; align-items:center; justify-content:space-between;
          font-size:11px; padding:3px 0;
        }
        .mobile-demo-left { display:flex; align-items:center; gap:6px; color:var(--text-mid); }
        .mobile-demo-pw {
          font-size:10px; font-weight:600; color:var(--green-mid);
          background:var(--teal-light); border:1px solid rgba(15,110,86,0.15);
          border-radius:4px; padding:2px 6px;
        }

        /* Heading */
        .form-heading { margin-bottom:28px; }
        .form-eyebrow {
          font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase;
          color:var(--text-hint); margin-bottom:8px;
        }
        .form-title { font-family:'Fraunces',serif; font-size:28px; font-weight:500; color:var(--text); line-height:1.15; margin-bottom:6px; }
        .form-sub { font-size:13px; color:var(--text-mid); line-height:1.6; }

        /* Role chips */
        .role-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:6px; margin-bottom:24px; }
        .role-chip {
          display:flex; flex-direction:column; align-items:center; gap:4px;
          padding:10px 6px 9px; border-radius:10px;
          border:1.5px solid var(--border); background:var(--white);
          cursor:pointer; font-family:inherit; transition:all 0.15s;
        }
        .role-chip:hover { border-color:var(--green); background:var(--teal-light); }
        .role-chip.active { border-color:var(--green); background:var(--teal-light); box-shadow:0 0 0 3px rgba(82,183,136,0.14); }
        .role-chip-icon { font-size:20px; line-height:1; }
        .role-chip-label { font-size:11px; font-weight:600; letter-spacing:0.04em; color:var(--text-mid); }
        .role-chip-email { font-size:9px; color:var(--text-hint); font-family:monospace; }
        .role-chip.active .role-chip-label { color:var(--green-mid); }
        .role-chip.active .role-chip-email { color:rgba(15,110,86,0.6); }

        /* Fields */
        .field { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
        .field-label { font-size:12px; font-weight:500; color:var(--text); display:flex; justify-content:space-between; align-items:center; }
        .field-input-wrap { position:relative; display:flex; align-items:center; }
        .field-input-icon { position:absolute; left:13px; color:var(--text-hint); pointer-events:none; flex-shrink:0; display:flex; align-items:center; }
        .field-input {
          width:100%; height:44px;
          border:1.5px solid var(--border); border-radius:10px;
          padding:0 42px 0 40px;
          font-size:14px; font-family:inherit; color:var(--text);
          background:var(--white); outline:none;
          transition:border-color 0.15s, box-shadow 0.15s;
        }
        .field-input::placeholder { color:var(--text-hint); }
        .field-input:hover { border-color:var(--border-deep); }
        .field-input:focus { border-color:var(--green); box-shadow:0 0 0 3px rgba(82,183,136,0.14); }
        .field-input.has-error { border-color:var(--red); box-shadow:0 0 0 3px rgba(163,45,45,0.1); }
        .eye-btn {
          position:absolute; right:11px;
          background:none; border:none; cursor:pointer;
          color:var(--text-hint); padding:4px; border-radius:6px;
          display:flex; align-items:center; transition:color 0.12s;
        }
        .eye-btn:hover { color:var(--text-mid); }

        /* Error */
        .error-box {
          display:flex; align-items:center; gap:8px;
          padding:10px 14px;
          background:var(--red-light); border:1px solid rgba(163,45,45,0.2);
          border-radius:9px; font-size:12.5px; color:var(--red);
          margin-bottom:16px; animation:errorShake 0.35s ease;
        }
        @keyframes errorShake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
        }

        /* Submit */
        .submit-btn {
          width:100%; height:46px;
          display:flex; align-items:center; justify-content:center; gap:8px;
          background:var(--green-deep); color:var(--green);
          border:1.5px solid rgba(82,183,136,0.25); border-radius:11px;
          font-size:13.5px; font-weight:600; font-family:inherit;
          cursor:pointer; letter-spacing:0.01em; margin-top:8px;
          transition:background 0.15s, transform 0.1s, box-shadow 0.15s;
        }
        .submit-btn:hover { background:#243629; box-shadow:0 4px 20px rgba(28,43,34,0.35); }
        .submit-btn:active { transform:scale(0.98); }
        .submit-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .spinner { width:17px; height:17px; border:2.5px solid rgba(82,183,136,0.3); border-top-color:var(--green); border-radius:50%; animation:spin 0.7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* Footer */
        .form-footer { margin-top:20px; text-align:center; font-size:11.5px; color:var(--text-hint); line-height:1.6; }

        /* Divider */
        .divider { height:1px; background:var(--border); margin:20px 0; position:relative; }
        .divider-label {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          background:var(--cream); padding:0 10px;
          font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-hint);
        }

        /* Stagger animations */
        .s1{animation:fadeUp 0.45s ease 0.05s both}
        .s2{animation:fadeUp 0.45s ease 0.12s both}
        .s3{animation:fadeUp 0.45s ease 0.19s both}
        .s4{animation:fadeUp 0.45s ease 0.26s both}
        .s5{animation:fadeUp 0.45s ease 0.33s both}
        .s6{animation:fadeUp 0.45s ease 0.40s both}
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Left branding panel ── */}
      <div className="left-panel">
        <div className="lbc lbc-1" />
        <div className="lbc lbc-2" />
        <div className="lbc lbc-3" />

        <div className="left-logo">
          <div className="left-logo-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 3C8 3 5 6 5 10c0 2 1 4 3 5.5l2 1.5v2h4v-2l2-1.5C18 14 19 12 19 10c0-4-3-7-7-7z" />
              <rect x="9" y="18" width="6" height="1.5" rx="0.75" />
              <rect x="10" y="20" width="4" height="1.5" rx="0.75" />
            </svg>
          </div>
          <div className="left-logo-name">Supa<span>care</span></div>
        </div>

        <div className="left-tagline">
          <div className="left-tagline-eyebrow">Clinical Intelligence</div>
          <h2 className="left-tagline-title">Smart nutrition,<br /><em>safer patients.</em></h2>
          <p className="left-tagline-body">
            AI-powered dietary analysis, inventory forecasting, and EHR-aware meal planning — built for modern care teams.
          </p>
        </div>

        <div className="left-features">
          {['Drug–food interaction detection', 'AI-generated per-patient meal plans', 'Real-time inventory forecasting', 'Priority-based patient triage'].map(f => (
            <div className="left-feature" key={f}>
              <div className="left-feature-dot" />
              {f}
            </div>
          ))}
        </div>

        {/* Demo credentials card */}
        <div className="demo-card">
          <div className="demo-card-label">Demo credentials</div>
          {ROLES.map(r => (
            <div className="demo-row" key={r.value}>
              <div className="demo-role">
                <span className="demo-role-icon">{r.icon}</span>
                <div>
                  <div className="demo-role-name">{r.label}</div>
                  <div className="demo-email">{r.email}</div>
                </div>
              </div>
              <span className="demo-pw">{DEMO_PASSWORD}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="right-panel">
        <div className={`form-shell ${mounted ? "visible" : ""}`}>

          {/* Mobile logo */}
          <div className="mobile-logo">
            <div className="mobile-logo-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 3C8 3 5 6 5 10c0 2 1 4 3 5.5l2 1.5v2h4v-2l2-1.5C18 14 19 12 19 10c0-4-3-7-7-7z" />
                <rect x="9" y="18" width="6" height="1.5" rx="0.75" />
                <rect x="10" y="20" width="4" height="1.5" rx="0.75" />
              </svg>
            </div>
            <div className="mobile-logo-name">Supa<span>care</span></div>
          </div>

          {/* Mobile demo credentials */}
          <div className="mobile-demo s1">
            <div className="mobile-demo-label">Demo accounts</div>
            {ROLES.map(r => (
              <div className="mobile-demo-row" key={r.value}>
                <div className="mobile-demo-left">
                  <span>{r.icon}</span>
                  <span style={{ fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.email}</span>
                </div>
                <span className="mobile-demo-pw">{DEMO_PASSWORD}</span>
              </div>
            ))}
          </div>

          {/* Heading */}
          <div className="form-heading s2">
            <div className="form-eyebrow">Secure Access</div>
            <h1 className="form-title">Welcome back</h1>
            <p className="form-sub">Sign in to your SupaCare account to continue.</p>
          </div>

          {/* Role quick-fill chips */}
          <div className="s3">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-hint)', marginBottom: 8 }}>
              Quick fill
            </div>
            <div className="role-grid">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`role-chip ${selectedRole === r.value ? "active" : ""}`}
                  onClick={() => fillDemo(r.value)}
                  title={`Sign in as ${r.label}`}
                >
                  <span className="role-chip-icon">{r.icon}</span>
                  <span className="role-chip-label">{r.label}</span>
                  <span className="role-chip-email">{r.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="divider s4"><span className="divider-label">or enter manually</span></div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="field s4">
              <label className="field-label" htmlFor="email">Email address</label>
              <div className="field-input-wrap">
                <span className="field-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  ref={emailRef}
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@supacare.health"
                  required
                  autoComplete="email"
                  className={`field-input ${error ? "has-error" : ""}`}
                />
              </div>
            </div>

            <div className="field s5">
              <label className="field-label" htmlFor="password">Password</label>
              <div className="field-input-wrap">
                <span className="field-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={`field-input ${error ? "has-error" : ""}`}
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide" : "Show"}>
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8S3.5 3 8 3s7 5 7 5-2.5 5-7 5S1 8 1 8z" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                      <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8S3.5 3 8 3s7 5 7 5-2.5 5-7 5S1 8 1 8z" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-box s5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M7 4v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <div className="s5">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    Sign in to SupaCare
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M3 7.5h9M8 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="form-footer s6">
            Contact your administrator if you can't access your account.
          </div>
        </div>
      </div>
    </div>
  );
}