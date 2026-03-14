"use client"
import { useState, use, useEffect, useRef } from 'react';
import { getPatientAnalysis, PatientAnalysis } from '@/lib/api';
import { AlertTriangle, Sparkles, Check, Pill, ShieldBan } from 'lucide-react';

// Animated number counter hook
function useCountUp(target: number, duration = 800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// Skeleton component
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded ${className}`}
      style={{
        background: 'linear-gradient(90deg, #e7e5e4 25%, #d6d3d1 50%, #e7e5e4 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  );
}

export default function PatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analysis, setAnalysis] = useState<PatientAnalysis | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getPatientAnalysis(id)
      .then((data) => {
        setAnalysis(data);
        // slight delay so skeleton is visible briefly even on fast loads
        setTimeout(() => setLoading(false), 400);
      })
      .catch((err) => {
        console.error("Patient API unreachable:", err);
        setError(true);
        setLoading(false);
      });
  }, [id]);

  // Trigger fade-in after loading completes
  useEffect(() => {
    if (!loading && analysis) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [loading, analysis]);

  const safeCount = useCountUp(analysis?.safeFoods.length ?? 0, 900, visible);
  const flagCount = useCountUp(analysis?.flaggedFoods.length ?? 0, 900, visible);
  const medCount = useCountUp(analysis?.patient.medications.length ?? 0, 900, visible);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <div className="text-center p-8 border border-stone-200 bg-white rounded-sm">
        <h2 className="font-['DM_Serif_Display'] text-xl mb-2">System Offline</h2>
        <p className="text-stone-500 text-sm">Unable to connect to the facility database.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-['DM_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes warningPulse {
          0%, 100% { background: transparent; }
          50% { background: rgba(200, 50, 50, 0.05); }
        }

        @keyframes chipPop {
          0% { opacity: 0; transform: scale(0.85); }
          70% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }

        .tag {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
        }

        .rule-line {
          height: 1px;
          background: linear-gradient(to right, #1a1a1a 60%, transparent);
          opacity: 0.12;
          margin: 0.75rem 0;
        }

        .card {
          background: #fff;
          border: 1px solid rgba(26,26,26,0.09);
          border-radius: 3px;
          padding: 1.75rem;
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }

        .card:hover {
          box-shadow: 0 4px 24px rgba(28,25,23,0.07);
          transform: translateY(-2px);
          border-color: rgba(26,26,26,0.15);
        }

        .card-section-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.15rem;
          color: #1c1917;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .med-row {
          padding: 0.9rem 1rem;
          border-top: 1px solid rgba(26,26,26,0.07);
          transition: background 0.15s ease;
          border-radius: 2px;
        }

        .med-row:last-child {
          border-bottom: 1px solid rgba(26,26,26,0.07);
        }

        .med-row:hover {
          background: rgba(26,26,26,0.02);
        }

        .med-warning {
          animation: warningPulse 2.5s ease-in-out infinite;
          border-radius: 3px;
        }

        .flag-item {
          padding: 0.9rem 0;
          border-top: 1px solid rgba(200,50,50,0.1);
          transition: background 0.15s ease;
        }

        .flag-item:last-child {
          border-bottom: 1px solid rgba(200,50,50,0.1);
        }

        .flag-item:hover {
          background: rgba(200,50,50,0.03);
        }

        .safe-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: #3d7a5a;
          border: 1px solid rgba(61,122,90,0.22);
          background: rgba(61,122,90,0.05);
          padding: 5px 12px;
          border-radius: 20px;
          font-weight: 500;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
        }

        .safe-chip:hover {
          background: rgba(61,122,90,0.1);
          border-color: rgba(61,122,90,0.4);
          transform: translateY(-1px);
        }

        .stagger-1 { animation: fadeUp 0.45s ease forwards; animation-delay: 0.05s; opacity: 0; }
        .stagger-2 { animation: fadeUp 0.45s ease forwards; animation-delay: 0.15s; opacity: 0; }
        .stagger-3 { animation: fadeUp 0.45s ease forwards; animation-delay: 0.25s; opacity: 0; }
        .stagger-4 { animation: fadeUp 0.45s ease forwards; animation-delay: 0.35s; opacity: 0; }
        .stagger-5 { animation: fadeUp 0.45s ease forwards; animation-delay: 0.45s; opacity: 0; }
      `}</style>

      <div className="max-w-5xl mx-auto px-8 py-12 space-y-10">

        {/* Header */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-1 w-full opacity-40" />
            <Skeleton className="h-10 w-72 mt-4" />
          </div>
        ) : (
          <div className="stagger-1">
            <div className="flex items-center justify-between mb-1">
              <span className="tag text-stone-400">Patient Record</span>
              <span className="tag text-stone-400">Room {analysis!.patient.room}</span>
            </div>
            <div className="rule-line" />
            <div className="mt-4 flex items-end justify-between">
              <h1 className="text-[2.4rem] font-['DM_Serif_Display',serif] text-stone-900 leading-tight">
                {analysis!.patient.name}
              </h1>
              <span className="tag text-stone-400 mb-1">EHR — {analysis!.patient.id}</span>
            </div>
          </div>
        )}

        {/* Mini stats row */}
        {!loading && (
          <div className="stagger-2 grid grid-cols-3 gap-0">
            {[
              { label: 'Medications', value: medCount },
              { label: 'Safe Foods', value: safeCount },
              { label: 'Flagged Foods', value: flagCount },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={i > 0 ? 'border-l border-stone-200 pl-8' : 'pr-8'}
                style={{ borderTop: '1px solid rgba(26,26,26,0.12)', paddingTop: '1.25rem' }}
              >
                <span className="tag text-stone-400 block mb-1">{stat.label}</span>
                <span
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '2.2rem',
                    lineHeight: 1,
                    color: '#1c1917',
                  }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* AI Summary */}
        {loading ? (
          <div className="space-y-2 p-7 border border-stone-200 rounded-sm bg-white">
            <Skeleton className="h-3 w-32 mb-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <div
            className="stagger-3 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #fdf8f0 0%, #faf4e8 100%)',
              border: '1px solid rgba(180,83,9,0.15)',
              borderRadius: '3px',
              padding: '1.75rem',
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(180,83,9,0.08)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <div className="absolute top-4 right-5 opacity-[0.06]">
              <Sparkles className="w-20 h-20 text-amber-900" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span className="tag text-amber-700">AI Nutritional Summary</span>
              </div>
              <p className="text-stone-800 text-base leading-relaxed font-['DM_Serif_Display',serif] italic text-[1.1rem]">
                "{analysis!.summary}"
              </p>
            </div>
          </div>
        )}

        <div className="stagger-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active EHR Monitors */}
          {loading ? (
            <div className="card space-y-3">
              <Skeleton className="h-4 w-40 mb-4" />
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="card">
              <div className="card-section-title">
                <Pill className="w-4 h-4 text-stone-400" />
                Active EHR Monitors
              </div>
              <div>
                {analysis!.patient.medications.map(med => (
                  <div
                    key={med}
                    className={`med-row ${['Warfarin', 'Lisinopril', 'MAOI'].includes(med) ? 'med-warning' : ''}`}
                  >
                    <p className="text-sm font-medium text-stone-800">{med}</p>
                    {med === 'Warfarin' && (
                      <p className="text-xs text-rose-700 mt-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Strictly avoid High Vitamin K
                      </p>
                    )}
                    {med === 'Lisinopril' && (
                      <p className="text-xs text-amber-700 mt-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Monitor Potassium intake
                      </p>
                    )}
                    {med === 'MAOI' && (
                      <p className="text-xs text-rose-700 mt-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Tyramine restriction active
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocked Foods */}
          {loading ? (
            <div className="card space-y-3">
              <Skeleton className="h-4 w-32 mb-4" />
              {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div
              className="card"
              style={{ borderColor: 'rgba(159,58,56,0.2)', background: 'rgba(254,249,249,0.7)' }}
            >
              <div className="card-section-title" style={{ color: '#7f1d1d' }}>
                <ShieldBan className="w-4 h-4 text-rose-400" />
                Blocked Foods
              </div>
              {analysis!.flaggedFoods.length === 0 ? (
                <p className="text-stone-400 text-sm">No foods blocked from current inventory.</p>
              ) : (
                <div>
                  {analysis!.flaggedFoods.map((flag, i) => (
                    <div key={i} className="flag-item">
                      <span className="text-sm font-medium text-rose-900">{flag.item.name}</span>
                      <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{flag.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Safe Foods */}
        {loading ? (
          <div className="card">
            <Skeleton className="h-4 w-40 mb-4" />
            <div className="flex flex-wrap gap-2 mt-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
            </div>
          </div>
        ) : (
          <div className="stagger-5 card">
            <div className="card-section-title">
              <Check className="w-4 h-4 text-emerald-500" />
              AI-Approved Inventory
            </div>
            <div className="rule-line" style={{ marginTop: '-0.5rem' }} />
            <div className="flex flex-wrap gap-2 mt-4">
              {analysis!.safeFoods.map((food, i) => (
                <span
                  key={food.id}
                  className="safe-chip"
                  style={{
                    animation: `chipPop 0.35s ease forwards`,
                    animationDelay: `${0.45 + i * 0.04}s`,
                    opacity: 0,
                  }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#5aab7d' }} />
                  {food.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}