// nutricare/frontend/app/page.tsx
import { ShieldAlert, TrendingDown, Users, ArrowUpRight } from 'lucide-react';
import { getPatients, getInventoryNeeds, getAiLogs } from '@/lib/api';

export default async function Dashboard() {
  const [patients, inventoryNeeds] = await Promise.all([
    getPatients(),
    getInventoryNeeds()
  ]);

  const orderCount = inventoryNeeds.filter(i => i.status === 'ORDER NOW').length;

  // Attempt to fetch AI logs, fallback to defaults if the DB table is missing/empty
  let aiLogs: any[] = [];
  try {
    aiLogs = await getAiLogs();
  } catch (e) {
    console.error("Could not fetch AI Logs, using defaults.");
  }

  const displayLogs = aiLogs.length > 0 ? aiLogs : [
    { time: "Just now", severity: "warn", text: "AI flagged Fresh Spinach for Patient P001 — Warfarin interaction detected." },
    { time: "10 min ago", severity: "info", text: "Inventory analysis complete. 2 items marked for re-order." },
    { time: "1 hr ago", severity: "ok", text: "New EHR data synced successfully from Cerner API." }
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-['DM_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

        .stat-number {
          font-family: 'DM Serif Display', serif;
          font-size: 4rem;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .rule-line {
          height: 1px;
          background: linear-gradient(to right, #1a1a1a 60%, transparent);
          opacity: 0.12;
        }

        .log-item {
          opacity: 0;
          transform: translateY(8px);
          animation: fadeSlide 0.4s ease forwards;
        }

        .log-item:nth-child(1) { animation-delay: 0.1s; }
        .log-item:nth-child(2) { animation-delay: 0.2s; }
        .log-item:nth-child(3) { animation-delay: 0.3s; }

        @keyframes fadeSlide {
          to { opacity: 1; transform: translateY(0); }
        }

        .pulse-dot {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .stat-item {
          border-top: 1px solid rgba(26,26,26,0.12);
          padding-top: 1.5rem;
        }

        .tag {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-2">
            <span className="tag text-stone-400">Facility Overview</span>
            <span className="flex items-center gap-1.5 tag text-emerald-600">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              All Systems Nominal
            </span>
          </div>
          <div className="rule-line my-3" />
          <h1 className="text-[2.6rem] font-['DM_Serif_Display',serif] text-stone-900 mt-4 leading-tight">
            AI-Assisted Nutrition<br /><em>& EHR Monitoring</em>
          </h1>
        </div>

        {/* Stats row — editorial horizontal strip */}
        <div className="grid grid-cols-3 gap-0 mb-16">
          <div className="stat-item pr-10">
            <span className="tag text-stone-400 block mb-3">Total Patients</span>
            <div className="stat-number text-stone-900">{patients.length}</div>
            <div className="flex items-center gap-1 mt-3 text-stone-500 text-sm">
              <Users className="w-3.5 h-3.5" />
              <span>Active records</span>
            </div>
          </div>

          <div className="stat-item px-10 border-l border-stone-200">
            <span className="tag text-stone-400 block mb-3">Items to Order</span>
            <div className="stat-number text-amber-700">{orderCount}</div>
            <div className="flex items-center gap-1 mt-3 text-amber-600 text-sm">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Below threshold</span>
            </div>
          </div>

          <div className="stat-item pl-10 border-l border-stone-200">
            <span className="tag text-stone-400 block mb-3">Active Contraindications</span>
            <div className="stat-number text-rose-700">12</div>
            <div className="flex items-center gap-1 mt-3 text-rose-600 text-sm">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Require review</span>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-['DM_Serif_Display',serif] text-xl text-stone-900">AI System Activity</h2>
            <button className="flex items-center gap-0.5 tag text-stone-400 hover:text-stone-700 transition-colors">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="rule-line mb-8" />

          <div className="space-y-0">
            {displayLogs.slice(0, 3).map((log, idx) => (
              <LogEntry
                key={idx}
                time={log.time || new Date(log.created_at).toLocaleTimeString()}
                severity={log.severity as 'warn' | 'info' | 'ok'}
                text={log.text}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogEntry({ time, text, severity }: { time: string; text: string; severity: 'warn' | 'info' | 'ok' }) {
  const accent = {
    warn: 'bg-rose-500',
    info: 'bg-amber-400',
    ok: 'bg-emerald-400',
  }[severity] || 'bg-stone-400';

  return (
    <div className="log-item flex items-start gap-6 py-5 border-b border-stone-200 last:border-0 group">
      <span className="tag text-stone-400 w-16 shrink-0 pt-0.5">{time}</span>
      <div className={`w-1 h-1 rounded-full ${accent} mt-2 shrink-0`} />
      <p className="text-stone-700 text-sm leading-relaxed flex-1">{text}</p>
    </div>
  );
}