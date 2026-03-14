"use client"
import { useState, useEffect, useMemo } from 'react';
import { getPatients, getInventory, getMedications, getAllergies, updatePatientPriority, InventoryItem, Patient, Priority, PRIORITY_CONFIG } from '@/lib/api';
import { addPatientAction, removePatientAction, updateStockAction, addInventoryAction, addMedicationAction, addAllergyAction } from './actions';
import { Trash2, Plus, Save, Search, X, SlidersHorizontal } from 'lucide-react';

// ─── Priority visual config ──────────────────────────────────────────────────
const P = {
  0: {
    label: 'Routine', bar: '#d6d3d1', badge: '#f5f4f2',
    badgeText: '#78716c', badgeBorder: '#e7e5e4',
    leftBorder: '#e2ded9', dot: '#c4bfba', ring: 'rgba(196,191,186,0.4)',
  },
  1: {
    label: 'Low', bar: '#34d399', badge: '#ecfdf5',
    badgeText: '#065f46', badgeBorder: '#a7f3d0',
    leftBorder: '#34d399', dot: '#34d399', ring: 'rgba(52,211,153,0.35)',
  },
  2: {
    label: 'High', bar: '#f59e0b', badge: '#fffbeb',
    badgeText: '#92400e', badgeBorder: '#fde68a',
    leftBorder: '#f59e0b', dot: '#f59e0b', ring: 'rgba(245,158,11,0.4)',
  },
  3: {
    label: 'Critical', bar: '#ef4444', badge: '#fef2f2',
    badgeText: '#991b1b', badgeBorder: '#fecaca',
    leftBorder: '#ef4444', dot: '#ef4444', ring: 'rgba(239,68,68,0.4)',
  },
} as const;

interface Filters {
  search: string;
  priorities: Set<number>;
  allergies: Set<string>;
  medications: Set<string>;
}

function PriorityBadge({ priority }: { priority: number }) {
  const c = P[priority as keyof typeof P];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase',
      fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: c.badge, color: c.badgeText, border: `1px solid ${c.badgeBorder}`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0,
        animation: priority === 3 ? 'criticalPulse 1.8s ease-in-out infinite' : 'none',
      }} />
      {c.label}
    </span>
  );
}

function PriorityDots({ current, patientId, onChange }: {
  current: number; patientId: string;
  onChange: (id: string, p: Priority) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
      {([0, 1, 2, 3] as Priority[]).map(level => {
        const c = P[level];
        const isActive = current === level;
        return (
          <button
            key={level} type="button" title={c.label}
            onClick={() => onChange(patientId, level)}
            style={{
              width: isActive ? 18 : 12, height: isActive ? 18 : 12,
              borderRadius: '50%',
              border: `2px solid ${isActive ? c.dot : 'rgba(168,162,158,0.22)'}`,
              background: isActive ? c.dot : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              flexShrink: 0, padding: 0,
              boxShadow: isActive && level > 0 ? `0 0 8px ${c.ring}` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

function FilterChip({ label, active, count, color, onClick }: {
  label: string; active: boolean; count?: number; color?: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20,
      border: active ? `1.5px solid ${color || '#1c1917'}` : '1.5px solid rgba(28,25,23,0.12)',
      background: active ? (color ? `${color}14` : 'rgba(28,25,23,0.06)') : 'transparent',
      color: active ? (color || '#1c1917') : '#78716c',
      fontSize: '0.68rem', letterSpacing: '0.03em',
      fontWeight: active ? 600 : 400, cursor: 'pointer',
      transition: 'all 0.14s', fontFamily: 'inherit', whiteSpace: 'nowrap',
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? (color || '#1c1917') : 'rgba(28,25,23,0.1)',
          color: active ? '#fff' : '#78716c', borderRadius: 20,
          fontSize: '0.58rem', fontWeight: 700, padding: '1px 5px',
          minWidth: 16, textAlign: 'center',
        }}>{count}</span>
      )}
    </button>
  );
}

function ActiveChip({ label, color, textColor, borderColor, onRemove }: {
  label: string; color: string; textColor: string; borderColor: string; onRemove: () => void;
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.62rem', padding: '2px 7px 2px 9px', borderRadius: 20,
      background: color, color: textColor, border: `1px solid ${borderColor}`, fontWeight: 600,
    }}>
      {label}
      <button type="button" onClick={onRemove} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px',
        lineHeight: 1, color: 'inherit', opacity: 0.55, fontSize: '0.8rem',
      }}>×</button>
    </span>
  );
}

export default function ManagePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [medications, setMedications] = useState<string[]>(['None']);
  const [allergies, setAllergies] = useState<string[]>(['None']);
  const [newMed, setNewMed] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '', priorities: new Set(), allergies: new Set(), medications: new Set(),
  });

  const refresh = async () => {
    try {
      const [p, i, m, a] = await Promise.all([
        getPatients(), getInventory(),
        getMedications().catch(() => []),
        getAllergies().catch(() => []),
      ]);
      setPatients(p); setInventory(i);
      setMedications(['None', ...m.filter(x => x !== 'None')]);
      setAllergies(['None', ...a.filter(x => x !== 'None')]);
    } catch (error) { console.error("Management API unreachable:", error); }
  };

  useEffect(() => { refresh(); }, []);

  // Derived filter options from real patient data
  const allAllergies = useMemo(() => {
    const s = new Set<string>();
    patients.forEach(p => (p.allergies || []).forEach(a => { if (a !== 'None') s.add(a); }));
    return [...s].sort();
  }, [patients]);

  const allMedications = useMemo(() => {
    const s = new Set<string>();
    patients.forEach(p => (p.medications || []).forEach(m => { if (m !== 'None') s.add(m); }));
    return [...s].sort();
  }, [patients]);

  const priorityCounts = useMemo(() => {
    const c: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    patients.forEach(p => { c[p.priority ?? 0]++; });
    return c;
  }, [patients]);

  // Filtered + sorted
  const filteredPatients = useMemo(() => {
    let r = [...patients];
    const q = filters.search.toLowerCase().trim();
    if (q) r = r.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.room.toLowerCase().includes(q)
    );
    if (filters.priorities.size > 0) r = r.filter(p => filters.priorities.has(p.priority ?? 0));
    if (filters.allergies.size > 0)
      r = r.filter(p => [...filters.allergies].some(a => (p.allergies || []).includes(a)));
    if (filters.medications.size > 0)
      r = r.filter(p => [...filters.medications].some(m => (p.medications || []).includes(m)));
    return r.sort((a, b) => ((b.priority ?? 0) - (a.priority ?? 0)));
  }, [patients, filters]);

  const chipFilterCount = filters.priorities.size + filters.allergies.size + filters.medications.size;
  const activeFilterCount = chipFilterCount + (filters.search ? 1 : 0);

  function toggleSet<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  }
  const clearFilters = () =>
    setFilters({ search: '', priorities: new Set(), allergies: new Set(), medications: new Set() });

  // Handlers
  const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    await addPatientAction({
      name: fd.get('name') as string,
      age: parseInt(fd.get('age') as string, 10),
      room: fd.get('room') as string,
      medications: fd.getAll('medications') as string[],
      allergies: fd.getAll('allergies') as string[],
      priority: selectedPriority,
    });
    form.reset(); setSelectedPriority(0); refresh();
  };

  const handleRemovePatient = async (id: string) => { await removePatientAction(id); refresh(); };

  const handleUpdateStock = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await updateStockAction(id, parseInt(fd.get('stock') as string, 10));
    refresh();
  };

  const handleAddInventory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    await addInventoryAction({
      name: fd.get('name') as string, unit: fd.get('unit') as string,
      stock: parseInt(fd.get('stock') as string, 10),
    });
    form.reset(); refresh();
  };

  const handleAddNewMed = async () => {
    if (!newMed.trim()) return;
    await addMedicationAction(newMed); setNewMed(''); refresh();
  };

  const handleAddNewAllergy = async () => {
    if (!newAllergy.trim()) return;
    await addAllergyAction(newAllergy); setNewAllergy(''); refresh();
  };

  const handleRosterPriority = async (patientId: string, priority: Priority) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, priority } : p));
    try { await updatePatientPriority(patientId, priority); refresh(); }
    catch { refresh(); }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-['DM_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

        @keyframes criticalPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.55); }
          50% { box-shadow: 0 0 0 4px rgba(239,68,68,0); }
        }
        @keyframes filterSlide {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .tag { font-size:.65rem; letter-spacing:.1em; text-transform:uppercase; font-weight:500; }
        .rule-line {
          height:1px; background:linear-gradient(to right,#1a1a1a 60%,transparent);
          opacity:.12; margin:.75rem 0;
        }
        .pulse-dot { animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        .toggle-group { display:flex; flex-wrap:wrap; gap:.4rem; }
        .toggle-group input[type="checkbox"] {
          position:absolute; opacity:0; width:0; height:0; pointer-events:none;
        }
        .toggle-group label {
          display:inline-flex; align-items:center; gap:.3rem;
          font-size:.72rem; letter-spacing:.04em;
          padding:.3rem .75rem; border-radius:20px;
          border:1px solid #e2ded9; background:#fff; color:#78716c;
          cursor:pointer; transition:all .15s ease; user-select:none; line-height:1.4;
        }
        .toggle-group label:hover { border-color:#a8a29e; color:#44403c; }
        .toggle-group input[type="checkbox"]:checked + label {
          background:#1c1917; border-color:#1c1917; color:#f5f0e8;
        }

        .inv-add-card {
          background:white; border:1.5px dashed #d6d3d1; border-radius:2px;
          padding:1.25rem; display:flex; flex-direction:column; gap:.75rem;
        }
        .field-label {
          display:block; font-size:.65rem; letter-spacing:.1em;
          text-transform:uppercase; color:#78716c; font-weight:500; margin-bottom:.375rem;
        }
        .field-input {
          width:100%; border:1px solid #e7e5e4; padding:.5rem .75rem;
          border-radius:2px; font-size:.8125rem; font-family:inherit;
          color:#1c1917; background:#fafaf9; transition:border-color .15s;
          outline:none; box-sizing:border-box;
        }
        .field-input:focus { border-color:#a8a29e; background:#fff; }
        .field-input::placeholder { color:#c4bfba; }

        /* Priority pills — form selector */
        .p-pill {
          display:inline-flex; align-items:center; gap:6px;
          font-size:.66rem; letter-spacing:.07em; text-transform:uppercase;
          font-weight:700; padding:7px 16px; border-radius:20px; border:2px solid;
          cursor:pointer; transition:all .18s; font-family:inherit;
        }
        .p-pill:not(.sel) { opacity:.35; transform:scale(.96); }
        .p-pill.sel { opacity:1; transform:scale(1); }
        .p-pill:hover:not(.sel) { opacity:.65; transform:scale(.98); }

        /* Roster rows */
        .roster-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:.9rem 1rem .9rem 1.1rem;
          border-bottom:1px solid rgba(28,25,23,0.06);
          transition:background .15s; position:relative;
        }
        .roster-row:last-child { border-bottom:none; }

        /* Left accent bar */
        .roster-row::before {
          content:''; position:absolute; left:0; top:8px; bottom:8px;
          width:3px; border-radius:0 2px 2px 0; transition:all .2s;
        }
        .roster-row.p0::before { background:#e2ded9; }
        .roster-row.p1::before { background:#34d399; }
        .roster-row.p2::before { background:#f59e0b; box-shadow:0 0 5px rgba(245,158,11,.4); }
        .roster-row.p3::before { background:#ef4444; box-shadow:0 0 8px rgba(239,68,68,.55); }

        .roster-row.p0 { background:transparent; }
        .roster-row.p0:hover { background:rgba(28,25,23,.015); }
        .roster-row.p1 { background:rgba(52,211,153,.025); }
        .roster-row.p1:hover { background:rgba(52,211,153,.045); }
        .roster-row.p2 { background:rgba(245,158,11,.03); }
        .roster-row.p2:hover { background:rgba(245,158,11,.055); }
        .roster-row.p3 { background:rgba(239,68,68,.035); }
        .roster-row.p3:hover { background:rgba(239,68,68,.06); }

        /* Filter panel */
        .filter-panel {
          background:#fff; border:1px solid rgba(28,25,23,.1); border-radius:4px;
          padding:1.1rem 1.4rem; margin-bottom:.6rem;
          animation:filterSlide .2s ease forwards;
        }
        .filter-section-label {
          font-size:.58rem; letter-spacing:.12em; text-transform:uppercase;
          font-weight:700; color:#c4bfba; margin-bottom:.45rem; display:block;
        }
        .search-wrap { position:relative; flex:1; }
        .search-icon {
          position:absolute; left:.65rem; top:50%;
          transform:translateY(-50%); pointer-events:none; color:#c4bfba;
        }
        .search-input {
          width:100%; border:1px solid #e7e5e4;
          padding:.5rem .75rem .5rem 2rem; border-radius:2px;
          font-size:.8125rem; font-family:inherit; color:#1c1917;
          background:#fafaf9; transition:border-color .15s; outline:none; box-sizing:border-box;
        }
        .search-input:focus { border-color:#a8a29e; background:#fff; }
        .search-input::placeholder { color:#c4bfba; }
      `}</style>

      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-1">
            <span className="tag text-stone-400">Admin Controls</span>
            <span className="tag text-emerald-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block pulse-dot" />
              Live Sync
            </span>
          </div>
          <div className="rule-line" />
          <h1 className="text-[2.2rem] font-['DM_Serif_Display',serif] text-stone-900 mt-3 leading-tight">
            Facility Management
          </h1>
          <p className="text-stone-500 text-sm mt-2">
            Add or discharge patients, and update current inventory stock levels.
          </p>
        </div>

        {/* Priority legend */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          padding: '0.6rem 0', marginBottom: '1.5rem',
          borderTop: '1px solid rgba(28,25,23,0.08)',
          borderBottom: '1px solid rgba(28,25,23,0.08)',
        }}>
          <span className="tag text-stone-400" style={{ letterSpacing: '0.1em' }}>Priority scale</span>
          {([0, 1, 2, 3] as const).map(level => (
            <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-block', width: 28, height: 4, borderRadius: 2,
                background: P[level].bar,
                boxShadow: level === 3 ? `0 0 6px ${P[level].ring}` : 'none',
              }} />
              <span style={{
                fontSize: '0.72rem', color: level === 0 ? '#a8a29e' : '#44403c',
                fontWeight: level >= 2 ? 600 : 400,
              }}>
                {P[level].label}
              </span>
              <span style={{ fontSize: '0.62rem', color: '#d6d3d1' }}>
                {priorityCounts[level] || 0}
              </span>
            </div>
          ))}
        </div>

        {/* ── Two-column layout ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

          {/* Admit Patient form */}
          <div>
            <h2 className="font-['DM_Serif_Display',serif] text-xl text-stone-900 mb-5">Admit Patient</h2>
            <form onSubmit={handleAddPatient} className="bg-white p-7 border border-stone-200/60 rounded-sm shadow-sm space-y-5">
              <div>
                <label className="field-label">Full Name</label>
                <input name="name" type="text" required className="field-input" placeholder="e.g. Jane Doe" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="field-label">Age</label>
                  <input name="age" type="number" required className="field-input" placeholder="65" />
                </div>
                <div className="flex-1">
                  <label className="field-label">Room</label>
                  <input name="room" type="text" required className="field-input" placeholder="101A" />
                </div>
              </div>

              {/* Priority selector — bold pills */}
              <div>
                <label className="field-label">Priority Level</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([0, 1, 2, 3] as Priority[]).map(level => {
                    const c = P[level];
                    const sel = selectedPriority === level;
                    return (
                      <button
                        key={level} type="button"
                        className={`p-pill ${sel ? 'sel' : ''}`}
                        style={{
                          color: sel ? '#fff' : c.badgeText,
                          background: sel ? c.bar : c.badge,
                          borderColor: c.bar,
                          boxShadow: sel && level >= 2 ? `0 3px 14px ${c.ring}` : 'none',
                        }}
                        onClick={() => setSelectedPriority(level)}
                      >
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          background: sel ? 'rgba(255,255,255,0.65)' : c.dot,
                          animation: level === 3 && sel ? 'criticalPulse 1.8s ease-in-out infinite' : 'none',
                        }} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Medications */}
              <div>
                <label className="field-label">Medications</label>
                <div className="toggle-group mb-2">
                  {medications.map(med => (
                    <span key={med}>
                      <input type="checkbox" name="medications" value={med} id={`med-${med}`} />
                      <label htmlFor={`med-${med}`}>{med}</label>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newMed} onChange={e => setNewMed(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewMed(); } }}
                    className="field-input flex-1 py-1 text-xs" placeholder="Add new medication..." />
                  <button type="button" onClick={handleAddNewMed} className="bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-600 px-3 rounded-sm text-[0.65rem] uppercase font-medium transition-colors">Add</button>
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="field-label">Allergies</label>
                <div className="toggle-group mb-2">
                  {allergies.map(allergy => (
                    <span key={allergy}>
                      <input type="checkbox" name="allergies" value={allergy} id={`allergy-${allergy}`} />
                      <label htmlFor={`allergy-${allergy}`}>{allergy}</label>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newAllergy} onChange={e => setNewAllergy(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewAllergy(); } }}
                    className="field-input flex-1 py-1 text-xs" placeholder="Add new allergy..." />
                  <button type="button" onClick={handleAddNewAllergy} className="bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-600 px-3 rounded-sm text-[0.65rem] uppercase font-medium transition-colors">Add</button>
                </div>
              </div>

              <button type="submit" className="flex items-center justify-center gap-2 w-full bg-stone-900 text-stone-50 py-3 mt-2 text-[0.7rem] tracking-widest uppercase font-medium rounded-sm hover:bg-stone-800 transition-colors">
                <Plus className="w-4 h-4" /> Admit Patient
              </button>
            </form>
          </div>

          {/* Active Roster */}
          <div>
            <h2 className="font-['DM_Serif_Display',serif] text-xl text-stone-900 mb-5">
              Active Roster
              <span style={{ fontSize: '0.82rem', color: '#a8a29e', fontWeight: 400, marginLeft: 8, fontFamily: 'inherit' }}>
                {filteredPatients.length}{patients.length !== filteredPatients.length ? ` of ${patients.length}` : ''}
              </span>
            </h2>

            {/* Search + filter row */}
            <div style={{ display: 'flex', gap: 7, marginBottom: 7, alignItems: 'center' }}>
              <div className="search-wrap">
                <Search className="search-icon" style={{ width: 12, height: 12 }} />
                <input
                  type="text" className="search-input"
                  placeholder="Search name, ID, room…"
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                />
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0.48rem 0.75rem',
                  border: filtersOpen ? '1px solid rgba(28,25,23,.28)' : '1px solid rgba(28,25,23,.15)',
                  borderRadius: 2,
                  background: filtersOpen ? 'rgba(28,25,23,.06)' : 'transparent',
                  fontSize: '0.72rem', color: filtersOpen ? '#1c1917' : '#44403c',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .14s', whiteSpace: 'nowrap',
                }}
              >
                <SlidersHorizontal style={{ width: 12, height: 12 }} />
                Filters
                {chipFilterCount > 0 && (
                  <span style={{
                    background: '#1c1917', color: '#fff', borderRadius: 20,
                    fontSize: '0.58rem', fontWeight: 700, padding: '1px 5px',
                  }}>{chipFilterCount}</span>
                )}
              </button>

              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '0.48rem 0.6rem',
                  border: '1px solid rgba(220,38,38,.22)', borderRadius: 2,
                  background: 'rgba(220,38,38,.04)',
                  fontSize: '0.68rem', color: '#dc2626',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .14s',
                }}>
                  <X style={{ width: 10, height: 10 }} /> Clear
                </button>
              )}
            </div>

            {/* Expandable filter panel */}
            {filtersOpen && (
              <div className="filter-panel">
                {/* Priority */}
                <div style={{ marginBottom: '0.9rem' }}>
                  <span className="filter-section-label">By priority</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {([3, 2, 1, 0] as const).map(level => (
                      <FilterChip
                        key={level}
                        label={P[level].label}
                        count={priorityCounts[level]}
                        active={filters.priorities.has(level)}
                        color={P[level].bar}
                        onClick={() => setFilters(f => ({ ...f, priorities: toggleSet(f.priorities, level) }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Medications */}
                {allMedications.length > 0 && (
                  <div style={{ marginBottom: '0.9rem' }}>
                    <span className="filter-section-label">By medication</span>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {allMedications.map(med => (
                        <FilterChip
                          key={med} label={med}
                          count={patients.filter(p => (p.medications || []).includes(med)).length}
                          active={filters.medications.has(med)}
                          onClick={() => setFilters(f => ({ ...f, medications: toggleSet(f.medications, med) }))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergies */}
                {allAllergies.length > 0 && (
                  <div>
                    <span className="filter-section-label">By allergy</span>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {allAllergies.map(allergy => (
                        <FilterChip
                          key={allergy} label={allergy}
                          count={patients.filter(p => (p.allergies || []).includes(allergy)).length}
                          active={filters.allergies.has(allergy)}
                          color="#ef4444"
                          onClick={() => setFilters(f => ({ ...f, allergies: toggleSet(f.allergies, allergy) }))}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active filter chips */}
            {chipFilterCount > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
                {[...filters.priorities].map(level => (
                  <ActiveChip
                    key={level}
                    label={P[level as keyof typeof P].label}
                    color={P[level as keyof typeof P].badge}
                    textColor={P[level as keyof typeof P].badgeText}
                    borderColor={P[level as keyof typeof P].badgeBorder}
                    onRemove={() => setFilters(f => ({ ...f, priorities: toggleSet(f.priorities, level) }))}
                  />
                ))}
                {[...filters.medications].map(m => (
                  <ActiveChip key={m} label={m}
                    color="rgba(28,25,23,0.06)" textColor="#44403c" borderColor="rgba(28,25,23,0.15)"
                    onRemove={() => setFilters(f => ({ ...f, medications: toggleSet(f.medications, m) }))}
                  />
                ))}
                {[...filters.allergies].map(a => (
                  <ActiveChip key={a} label={`⚠ ${a}`}
                    color="rgba(220,38,38,0.07)" textColor="#991b1b" borderColor="rgba(220,38,38,0.22)"
                    onRemove={() => setFilters(f => ({ ...f, allergies: toggleSet(f.allergies, a) }))}
                  />
                ))}
              </div>
            )}

            {/* Roster list */}
            <div className="bg-white border border-stone-200/60 rounded-sm shadow-sm overflow-hidden">
              {filteredPatients.length === 0 ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                  <p className="text-stone-400 text-sm">
                    {patients.length === 0 ? 'No active patients.' : 'No patients match the current filters.'}
                  </p>
                  {activeFilterCount > 0 && (
                    <button type="button" onClick={clearFilters} style={{
                      marginTop: 8, fontSize: '0.72rem', color: '#78716c',
                      textDecoration: 'underline', background: 'none',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}>Clear filters</button>
                  )}
                </div>
              ) : (
                filteredPatients.map(p => {
                  const priority = (p.priority ?? 0) as Priority;
                  return (
                    <div key={p.id} className={`roster-row p${priority}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                            <span style={{
                              fontWeight: 500, color: '#1c1917', fontSize: '0.875rem',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>{p.name}</span>
                            <PriorityBadge priority={priority} />
                          </div>
                          <div style={{
                            fontSize: '0.67rem', color: '#a8a29e', marginTop: 3,
                            display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center',
                          }}>
                            <span>Room {p.room}</span>
                            <span style={{ color: '#d6d3d1' }}>·</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.63rem', color: '#c4bfba' }}>{p.id}</span>
                            {(p.allergies || []).filter(a => a !== 'None').length > 0 && (
                              <>
                                <span style={{ color: '#d6d3d1' }}>·</span>
                                <span style={{ color: '#dc2626', fontSize: '0.62rem', fontWeight: 600 }}>
                                  ⚠ {(p.allergies || []).filter(a => a !== 'None').join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <PriorityDots current={priority} patientId={p.id} onChange={handleRosterPriority} />
                      </div>
                      <button
                        onClick={() => handleRemovePatient(p.id)} type="button"
                        style={{
                          padding: '0.35rem', background: 'none', border: 'none',
                          cursor: 'pointer', transition: 'color .15s', marginLeft: 8,
                          flexShrink: 0, color: '#d6d3d1',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#d6d3d1')}
                        title="Discharge Patient"
                      >
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="rule-line mb-10" />

        {/* Inventory */}
        <div>
          <h2 className="font-['DM_Serif_Display',serif] text-xl text-stone-900 mb-5">Inventory Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {inventory.map(item => (
              <form key={`f-${item.id}`} onSubmit={e => handleUpdateStock(item.id, e)} className="bg-white p-5 border border-stone-200/60 rounded-sm shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-stone-900 text-sm">{item.name}</div>
                    <div className="text-[0.65rem] tracking-wider uppercase text-stone-400 mt-1">{item.id}</div>
                  </div>
                  <span className="text-[0.65rem] tracking-wider uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{item.unit}</span>
                </div>
                <div className="flex gap-2 items-center mt-auto">
                  <div className="relative flex-1">
                    <input type="number" name="stock" defaultValue={item.stock} className="field-input" />
                  </div>
                  <button type="submit" className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-2.5 rounded-sm transition-colors" title="Save Stock">
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ))}
            <form onSubmit={handleAddInventory} className="inv-add-card">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[0.65rem] tracking-widest uppercase text-stone-400 font-medium">New Item</span>
              </div>
              <div>
                <label className="field-label">Item Name</label>
                <input name="name" type="text" required className="field-input" placeholder="e.g. Olive Oil" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="field-label">Unit</label>
                  <input name="unit" type="text" required className="field-input" placeholder="ml, g, pkg…" />
                </div>
                <div className="flex-1">
                  <label className="field-label">Stock</label>
                  <input name="stock" type="number" required min="0" className="field-input" placeholder="0" />
                </div>
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 w-full mt-1 bg-stone-900 text-stone-50 py-2.5 text-[0.68rem] tracking-widest uppercase font-medium rounded-sm hover:bg-stone-800 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}