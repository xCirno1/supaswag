import { analyzePatientDiet } from '@/lib/ai-engine';
import { AlertTriangle, Sparkles, Check, Pill, ShieldBan } from 'lucide-react';

export default async function PatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = analyzePatientDiet(id);

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-['DM_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

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
        }

        .med-row:last-child {
          border-bottom: 1px solid rgba(26,26,26,0.07);
        }

        .flag-item {
          padding: 0.9rem 0;
          border-top: 1px solid rgba(200,50,50,0.1);
        }

        .flag-item:last-child {
          border-bottom: 1px solid rgba(200,50,50,0.1);
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
        }

        .fade-in {
          opacity: 0;
          transform: translateY(8px);
          animation: fadeUp 0.4s ease forwards;
        }

        .fade-in:nth-child(1) { animation-delay: 0.05s; }
        .fade-in:nth-child(2) { animation-delay: 0.15s; }
        .fade-in:nth-child(3) { animation-delay: 0.25s; }
        .fade-in:nth-child(4) { animation-delay: 0.35s; }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-8 py-12 space-y-10">

        {/* Header */}
        <div className="fade-in">
          <div className="flex items-center justify-between mb-1">
            <span className="tag text-stone-400">Patient Record</span>
            <span className="tag text-stone-400">Room {analysis.patient.room}</span>
          </div>
          <div className="rule-line" />
          <div className="mt-4 flex items-end justify-between">
            <h1 className="text-[2.4rem] font-['DM_Serif_Display',serif] text-stone-900 leading-tight">
              {analysis.patient.name}
            </h1>
            <span className="tag text-stone-400 mb-1">EHR — {analysis.patient.id}</span>
          </div>
        </div>

        {/* AI Summary */}
        <div
          className="fade-in relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #fdf8f0 0%, #faf4e8 100%)',
            border: '1px solid rgba(180,83,9,0.15)',
            borderRadius: '3px',
            padding: '1.75rem',
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
              "{analysis.summary}"
            </p>
          </div>
        </div>

        <div className="fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active EHR Monitors */}
          <div className="card">
            <div className="card-section-title">
              <Pill className="w-4 h-4 text-stone-400" />
              Active EHR Monitors
            </div>
            <div>
              {analysis.patient.medications.map(med => (
                <div key={med} className="med-row">
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

          {/* Blocked Foods */}
          <div
            className="card"
            style={{ borderColor: 'rgba(159,58,56,0.2)', background: 'rgba(254,249,249,0.7)' }}
          >
            <div className="card-section-title" style={{ color: '#7f1d1d' }}>
              <ShieldBan className="w-4 h-4 text-rose-400" />
              Blocked Foods
            </div>
            {analysis.flaggedFoods.length === 0 ? (
              <p className="text-stone-400 text-sm">No foods blocked from current inventory.</p>
            ) : (
              <div>
                {analysis.flaggedFoods.map((flag, i) => (
                  <div key={i} className="flag-item">
                    <span className="text-sm font-medium text-rose-900">{flag.item.name}</span>
                    <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{flag.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Safe Foods */}
        <div className="fade-in card">
          <div className="card-section-title">
            <Check className="w-4 h-4 text-emerald-500" />
            AI-Approved Inventory
          </div>
          <div className="rule-line" style={{ marginTop: '-0.5rem' }} />
          <div className="flex flex-wrap gap-2 mt-4">
            {analysis.safeFoods.map(food => (
              <span key={food.id} className="safe-chip">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: '#5aab7d' }}
                />
                {food.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}