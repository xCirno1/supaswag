"use client"
import { getMealPlans, MealPlan } from '@/lib/api';
import { Sparkles, AlertTriangle } from 'lucide-react';

export default async function MealPlans() {
  let mealPlans: MealPlan[] = [];

  try {
    mealPlans = await getMealPlans();
  } catch (error) {
    console.error("Meal API unreachable:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
        <div className="text-center p-8 border border-stone-200 bg-white rounded-sm">
          <h2 className="font-['DM_Serif_Display'] text-xl mb-2">System Offline</h2>
          <p className="text-stone-500 text-sm">Unable to connect to the facility database.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');

        .page-rule {
          height: 1px;
          background: linear-gradient(to right, rgba(28,25,23,0.15), transparent);
        }

        .meal-row {
          display: grid;
          grid-template-columns: 10rem 1fr auto;
          align-items: start;
          gap: 2rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid rgba(28,25,23,0.07);
          transition: background 0.15s ease;
        }

        .meal-row:last-child {
          border-bottom: none;
        }

        .patient-name {
          font-family: 'DM Serif Display', serif;
          font-size: 1.05rem;
          color: #1c1917;
          line-height: 1.2;
        }

        .room-tag {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
          color: #a8a29e;
          margin-top: 0.25rem;
        }

        .meal-text {
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem;
          color: #1c1917;
          line-height: 1.3;
        }

        .meal-label {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
          color: #d6d3d1;
          margin-bottom: 0.4rem;
        }

        .flag-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.68rem;
          letter-spacing: 0.04em;
          color: #b45309;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 2rem;
          padding: 0.25rem 0.65rem;
          margin-top: 0.6rem;
          margin-right: 0.3rem;
          display: inline-flex;
        }

        .regen-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
          color: #78716c;
          background: transparent;
          border: 1px solid rgba(28,25,23,0.15);
          border-radius: 2rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .regen-btn:hover {
          color: #1c1917;
          border-color: rgba(28,25,23,0.4);
        }

        .column-head {
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
          color: #d6d3d1;
          padding-bottom: 0.75rem;
        }

        .col-rule {
          height: 1px;
          background: rgba(28,25,23,0.08);
          margin-bottom: 0;
        }
      `}</style>

      {/* Header */}
      <div className="mb-10">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="room-tag" style={{ marginBottom: '0.5rem' }}>Today · Auto-generated</p>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.4rem', color: '#1c1917', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              AI Meal Plans
            </h1>
          </div>
          <button className="regen-btn" style={{ marginTop: '0.5rem' }}>
            <Sparkles style={{ width: '0.75rem', height: '0.75rem' }} />
            Regenerate
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#a8a29e', marginTop: '0.6rem' }}>
          Assigned from safe-food inventory · EHR contraindications applied
        </p>
        <div className="page-rule" style={{ marginTop: '1.5rem' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '10rem 1fr auto', gap: '2rem', paddingBottom: '0.5rem' }}>
        <span className="column-head">Patient</span>
        <span className="column-head">Dinner Assignment</span>
        <span className="column-head" style={{ textAlign: 'right' }}>Alerts</span>
      </div>
      <div className="col-rule" />

      {mealPlans.map(({ patient, protein, side, flags }) => (
        <div key={patient.id} className="meal-row">
          <div>
            <div className="patient-name">{patient.name}</div>
            <div className="room-tag">Room {patient.room}</div>
          </div>

          <div>
            <div className="meal-label">Dinner</div>
            <div className="meal-text">{protein}</div>
            <div style={{ fontSize: '0.8rem', color: '#a8a29e', marginTop: '0.2rem' }}>
              with {side}
            </div>

            {flags.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                {flags.map((f, i) => (
                  <span key={i} className="flag-pill">
                    <AlertTriangle style={{ width: '0.6rem', height: '0.6rem' }} />
                    Avoid: {f.item.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', paddingTop: '0.15rem' }}>
            {flags.length > 0 ? (
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.3rem', color: '#b45309' }}>
                {flags.length}
              </span>
            ) : (
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10b981', fontWeight: 500 }}>
                Clear
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}