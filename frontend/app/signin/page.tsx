"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Portal = "medical" | "food";
type MedicalRole = "doctor" | "nurse" | "guardian";

export default function SignInPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<Portal>("medical");
  const [role, setRole] = useState<MedicalRole>("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload =
        portal === "medical"
          ? { email, password, role, portal: "medical" }
          : { email, password, portal: "food" };

      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Invalid credentials. Please try again.");
      }

      router.push(portal === "food" ? "/food-admin" : `/${role}-dashboard`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const medicalRoles: { value: MedicalRole; label: string; icon: string }[] = [
    { value: "doctor", label: "Doctor", icon: "🩺" },
    { value: "nurse", label: "Nurse", icon: "💊" },
    { value: "guardian", label: "Guardian", icon: "👤" },
  ];

  const isMedical = portal === "medical";

  return (
    <div className="signin-root">
      {/* Background decoration */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />

      <main className="signin-container">
        {/* Header */}
        <div className="brand">
          <div className="brand-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill={isMedical ? "#1D9E75" : "#378ADD"} />
              <path
                d={
                  isMedical
                    ? "M14 6v16M6 14h16"
                    : "M8 10h12M8 14h8M8 18h10"
                }
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="brand-name">SupaSwag</span>
        </div>

        <div className="card">
          {/* Portal toggle */}
          <div className="portal-toggle">
            <button
              type="button"
              className={`toggle-btn ${isMedical ? "active" : ""}`}
              onClick={() => { setPortal("medical"); setError(""); }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 1.5C7.5 1.5 3 4.5 3 8.5a4.5 4.5 0 009 0C12 4.5 7.5 1.5 7.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M7.5 6v3M6 7.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Medical Staff
            </button>
            <button
              type="button"
              className={`toggle-btn ${!isMedical ? "active" : ""}`}
              onClick={() => { setPortal("food"); setError(""); }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2 4h11M4 4V2.5M11 4V2.5M3 7h9M3.5 10.5l.5 2h7l.5-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Food Admin
            </button>
          </div>

          {/* Heading */}
          <div className="card-header">
            <h1 className="card-title">
              {isMedical ? "Staff Sign In" : "Admin Sign In"}
            </h1>
            <p className="card-subtitle">
              {isMedical
                ? "Access patient and care management"
                : "Manage meal planning and dietary records"}
            </p>
          </div>

          {/* Role selector — medical only */}
          {isMedical && (
            <div className="role-selector">
              {medicalRoles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`role-btn ${role === r.value ? "selected" : ""}`}
                  onClick={() => setRole(r.value)}
                >
                  <span className="role-icon">{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label className="field-label" htmlFor="email">
                Email address
              </label>
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospital.org"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <div className="field-label-row">
                <label className="field-label" htmlFor="password">Password</label>
                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
              </div>
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8S3.5 3 8 3s7 5 7 5-2.5 5-7 5S1 8 1 8z" stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                      <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8S3.5 3 8 3s7 5 7 5-2.5 5-7 5S1 8 1 8z" stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-banner" role="alert">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7.5 4.5v3M7.5 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className={`submit-btn ${loading ? "loading" : ""}`} disabled={loading}>
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  Sign in
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="card-footer-note">
            Having trouble signing in? Contact your{" "}
            <a href="mailto:support@supaswag.health">system administrator</a>.
          </p>
        </div>

        <p className="page-footer">
          &copy; {new Date().getFullYear()} SupaSwag Health &mdash; Secure access portal
        </p>
      </main>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .signin-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f4f6f9;
          font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
          position: relative;
          overflow: hidden;
          padding: 2rem 1rem;
        }

        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@600;700&display=swap');

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          pointer-events: none;
        }
        .bg-orb-1 {
          width: 520px; height: 520px;
          top: -120px; left: -100px;
          background: radial-gradient(circle, #1D9E75 0%, transparent 70%);
        }
        .bg-orb-2 {
          width: 400px; height: 400px;
          bottom: -80px; right: -80px;
          background: radial-gradient(circle, #378ADD 0%, transparent 70%);
        }
        .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .signin-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-mark {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
          letter-spacing: -0.5px;
        }

        .card {
          width: 100%;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 4px 32px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .portal-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          background: #f1f3f6;
          border-radius: 12px;
          padding: 5px;
        }
        .toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 12px;
          border: none;
          border-radius: 9px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s ease;
          color: #6b7280;
          background: transparent;
          font-family: inherit;
        }
        .toggle-btn.active {
          background: #ffffff;
          color: #111827;
          box-shadow: 0 1px 6px rgba(0,0,0,0.1);
        }
        .toggle-btn:not(.active):hover { color: #374151; }

        .card-header { display: flex; flex-direction: column; gap: 4px; }
        .card-title {
          font-family: 'Sora', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.4px;
        }
        .card-subtitle {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }

        .role-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .role-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 10px 6px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .role-btn:hover { border-color: #9ca3af; background: #f9fafb; }
        .role-btn.selected {
          border-color: #1D9E75;
          background: #f0fdf8;
          color: #0f6e56;
        }
        .role-icon { font-size: 18px; line-height: 1; }

        .form { display: flex; flex-direction: column; gap: 1rem; }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .field-label {
          font-size: 13.5px;
          font-weight: 500;
          color: #374151;
        }
        .forgot-link {
          font-size: 13px;
          color: #1D9E75;
          text-decoration: none;
          font-weight: 500;
        }
        .forgot-link:hover { text-decoration: underline; }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          color: #9ca3af;
          pointer-events: none;
          flex-shrink: 0;
        }
        .input-wrapper input {
          width: 100%;
          height: 44px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 0 40px 0 38px;
          font-size: 14.5px;
          color: #111827;
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .input-wrapper input::placeholder { color: #c4c9d4; }
        .input-wrapper input:hover { border-color: #9ca3af; }
        .input-wrapper input:focus {
          border-color: #1D9E75;
          box-shadow: 0 0 0 3px rgba(29,158,117,0.12);
        }
        .eye-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          border-radius: 4px;
        }
        .eye-btn:hover { color: #6b7280; }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 9px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 13.5px;
        }

        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 46px;
          border: none;
          border-radius: 11px;
          background: #1D9E75;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          font-family: inherit;
          margin-top: 2px;
        }
        .submit-btn:hover { background: #0f8762; }
        .submit-btn:active { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .submit-btn.loading { pointer-events: none; }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .card-footer-note {
          font-size: 12.5px;
          color: #9ca3af;
          text-align: center;
          line-height: 1.6;
        }
        .card-footer-note a {
          color: #1D9E75;
          text-decoration: none;
          font-weight: 500;
        }
        .card-footer-note a:hover { text-decoration: underline; }

        .page-footer {
          font-size: 12px;
          color: #b0b7c3;
          text-align: center;
        }

        /* Food admin accent overrides */
        .role-btn.selected[data-portal="food"] { border-color: #378ADD; background: #eff6ff; color: #185FA5; }
        .input-wrapper input:focus[data-portal="food"] { border-color: #378ADD; box-shadow: 0 0 0 3px rgba(55,138,221,0.12); }

        @media (max-width: 480px) {
          .card { padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
