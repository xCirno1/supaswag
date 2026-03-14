"use client"
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { getPatients, updatePatientPriority, Patient, Priority } from '@/lib/api';

const P = {
  0: { label: 'Routine', bar: '#d6d3d1', dot: '#c4bfba', badge: '#f5f4f2', badgeText: '#78716c', badgeBorder: '#e7e5e4', rowBg: 'transparent', leftBorder: '#e2ded9' },
  1: { label: 'Low', bar: '#34d399', dot: '#34d399', badge: '#ecfdf5', badgeText: '#065f46', badgeBorder: '#a7f3d0', rowBg: 'rgba(52,211,153,0.025)', leftBorder: '#34d399' },
  2: { label: 'High', bar: '#f59e0b', dot: '#f59e0b', badge: '#fffbeb', badgeText: '#92400e', badgeBorder: '#fde68a', rowBg: 'rgba(245,158,11,0.03)', leftBorder: '#f59e0b' },
  3: { label: 'Critical', bar: '#ef4444', dot: '#ef4444', badge: '#fef2f2', badgeText: '#991b1b', badgeBorder: '#fecaca', rowBg: 'rgba(239,68,68,0.035)', leftBorder: '#ef4444' },
} as const;

// Floor colors — one per floor level, cycling if > 6 floors
const FLOOR_COLORS = [
  { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE', active: '#4F46E5' }, // indigo
  { bg: '#F0FDF4', text: '#14532D', border: '#BBF7D0', active: '#16A34A' }, // green
  { bg: '#FFF7ED', text: '#7C2D12', border: '#FED7AA', active: '#EA580C' }, // orange
  { bg: '#FDF4FF', text: '#581C87', border: '#E9D5FF', active: '#9333EA' }, // purple
  { bg: '#F0F9FF', text: '#0C4A6E', border: '#BAE6FD', active: '#0284C7' }, // sky
  { bg: '#FFF1F2', text: '#881337', border: '#FECDD3', active: '#E11D48' }, // rose
];

function getFloor(room: string): string {
  const match = room.match(/\d/);
  return match ? match[0] : '?';
}

function floorLabel(floor: string): string {
  if (floor === '?') return 'Unknown';
  const n = parseInt(floor);
  if (n === 0) return 'Ground Floor';
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix} Floor`;
}

function PriorityBadge({ priority }: { priority: number }) {
  const c = P[priority as keyof typeof P];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase',
      fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: c.badge, color: c.badgeText, border: `1px solid ${c.badgeBorder}`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFloor, setActiveFloor] = useState<string | null>(null);

  const fetchPatients = () =>
    getPatients()
      .then(data => {
        const sorted = [...data].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        setPatients(sorted);
        if (!selected && sorted.length > 0) setSelected(sorted[0]);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

  useEffect(() => { fetchPatients(); }, []);

  const handlePriority = async (patientId: string, priority: Priority) => {
    setPatients(prev => [...prev.map(p => p.id === patientId ? { ...p, priority } : p)].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)));
    if (selected?.id === patientId) setSelected(prev => prev ? { ...prev, priority } : prev);
    try { await updatePatientPriority(patientId, priority); fetchPatients(); } catch { fetchPatients(); }
  };

  // Derive sorted floor list from patient rooms
  const floors = useMemo(() => {
    const seen = new Map<string, number>();
    patients.forEach(p => {
      const f = getFloor(p.room);
      seen.set(f, (seen.get(f) ?? 0) + 1);
    });
    return [...seen.entries()]
      .sort(([a], [b]) => (a === '?' ? 1 : b === '?' ? -1 : parseInt(a) - parseInt(b)))
      .map(([floor, count], idx) => ({
        floor,
        count,
        colors: FLOOR_COLORS[idx % FLOOR_COLORS.length],
      }));
  }, [patients]);

  const filteredPatients = useMemo(() => {
    if (!activeFloor) return patients;
    return patients.filter(p => getFloor(p.room) === activeFloor);
  }, [patients, activeFloor]);

  const critCount = patients.filter(p => (p.priority ?? 0) === 3).length;

  // If selected patient is not in current floor filter, reset selection
  useEffect(() => {
    if (selected && activeFloor && getFloor(selected.room) !== activeFloor) {
      setSelected(filteredPatients[0] ?? null);
    }
  }, [activeFloor]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes critPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.55)} 50%{box-shadow:0 0 0 4px rgba(239,68,68,0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .topbar { display:flex; align-items:center; gap:12px; padding:14px 24px; border-bottom:1px solid #E5E0D6; background:#fff; flex-shrink:0; }
        .topbar-title { font-family:'Fraunces',serif; font-size:18px; font-weight:500; color:#1A1A18; flex:1; }
        .topbar-title span { color:#52B788; }

        /* Floor tab bar */
        .floor-bar { display:flex; align-items:center; gap:6px; padding:10px 16px; border-bottom:1px solid #E5E0D6; background:#fff; flex-shrink:0; overflow-x:auto; scrollbar-width:none; }
        .floor-bar::-webkit-scrollbar { display:none; }

        .floor-tab {
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 12px; border-radius:20px; border:1.5px solid;
          font-size:11px; font-weight:500; cursor:pointer;
          transition:all 0.15s; white-space:nowrap; flex-shrink:0;
          font-family:inherit; background:transparent;
        }
        .floor-tab-count {
          font-size:10px; font-weight:700;
          padding:1px 5px; border-radius:20px; min-width:16px; text-align:center;
        }

        .content-area { display:flex; flex:1; overflow:hidden; min-height:0; }
        .patient-list { width:260px; border-right:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; display:flex; flex-direction:column; }
        .list-header { padding:12px 16px 8px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
        .list-header-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; }

        /* Floor section header inside list */
        .floor-section-header {
          padding:6px 16px 4px;
          font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase;
          color:#A8A59F; background:#FAFAF8; border-bottom:1px solid #E5E0D6;
          border-top:1px solid #E5E0D6; margin-top:4px; flex-shrink:0;
          display:flex; align-items:center; gap:6px;
        }
        .floor-section-header:first-child { margin-top:0; border-top:none; }

        .patient-card { padding:10px 16px; border-bottom:1px solid #E5E0D6; cursor:pointer; transition:background 0.1s; position:relative; text-decoration:none; display:block; }
        .patient-card:hover { background:#F9F6F1; }
        .patient-card.active { background:#E1F5EE; }
        .pc-left-bar { position:absolute; left:0; top:8px; bottom:8px; width:3px; border-radius:0 2px 2px 0; }
        .pc-top { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
        .pc-avatar { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:500; flex-shrink:0; }
        .pc-name { font-size:13px; font-weight:500; color:#1A1A18; flex:1; }
        .pc-tags { display:flex; gap:4px; flex-wrap:wrap; margin-top:2px; }
        .tag { font-size:10px; padding:2px 7px; border-radius:20px; font-weight:500; }
        .tag-red { background:#FCEBEB; color:#A32D2D; }
        .tag-amber { background:#FAEEDA; color:#B5641B; }

        .empty-floor { padding:24px 16px; text-align:center; color:#A8A59F; font-size:12px; }

        .detail-pane { flex:1; min-width:0; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:16px; }
        .patient-header { display:flex; align-items:center; gap:14px; }
        .big-avatar { width:48px; height:48px; border-radius:50%; background:#E1F5EE; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:500; color:#0F6E56; flex-shrink:0; }
        .patient-meta h2 { font-family:'Fraunces',serif; font-size:20px; font-weight:500; margin-bottom:2px; }
        .patient-meta p { font-size:12px; color:#6B6860; }
        .action-row { display:flex; gap:8px; margin-left:auto; }

        .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .info-card { background:#fff; border:1px solid #E5E0D6; border-radius:12px; padding:14px 16px; }
        .info-card-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:8px; }
        .condition-item { font-size:12px; color:#1A1A18; display:flex; align-items:center; gap:6px; margin-bottom:5px; }
        .condition-item::before { content:''; width:6px; height:6px; border-radius:50%; background:#B5641B; flex-shrink:0; }

        .med-chip { display:inline-block; font-size:11px; color:#6B6860; border:1px solid #E5E0D6; border-radius:20px; padding:2px 9px; margin:2px; }

        .right-panel { width:220px; border-left:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; padding:16px; }
        .rp-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:10px; }
        .rp-section { margin-bottom:20px; }

        .priority-dot-btn { width:12px; height:12px; border-radius:50%; border:2px solid rgba(168,162,158,0.22); background:transparent; cursor:pointer; transition:all 0.2s; flex-shrink:0; padding:0; }
        .priority-dot-btn.active { width:18px; height:18px; }

        .link-btn { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; padding:6px 12px; border-radius:8px; border:1px solid #E5E0D6; background:#fff; cursor:pointer; color:#1A1A18; text-decoration:none; }
        .link-btn.primary { background:#2D6A4F; border-color:#2D6A4F; color:white; }

        /* Floor badge in detail pane */
        .floor-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:3px 10px; border-radius:20px; }
      `}</style>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-title">Supa<span>care</span></div>
        <span style={{ fontSize: 12, color: '#6B6860' }}>{patients.length} patients · Select to view AI analysis</span>
        {critCount > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F5C4C4' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'critPulse 1.8s infinite' }} />
            {critCount} critical
          </span>
        )}
      </div>

      {/* Floor tab bar */}
      {!loading && floors.length > 1 && (
        <div className="floor-bar">
          <span style={{ fontSize: 10, fontWeight: 600, color: '#A8A59F', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 2, flexShrink: 0 }}>Floor</span>

          {/* All tab */}
          <button
            className="floor-tab"
            onClick={() => setActiveFloor(null)}
            style={{
              borderColor: activeFloor === null ? '#1C2B22' : '#E5E0D6',
              background: activeFloor === null ? '#1C2B22' : 'transparent',
              color: activeFloor === null ? '#52B788' : '#6B6860',
            }}
          >
            All
            <span className="floor-tab-count" style={{
              background: activeFloor === null ? 'rgba(82,183,136,0.2)' : '#F0EDE8',
              color: activeFloor === null ? '#52B788' : '#6B6860',
            }}>
              {patients.length}
            </span>
          </button>

          {floors.map(({ floor, count, colors }) => {
            const isActive = activeFloor === floor;
            return (
              <button
                key={floor}
                className="floor-tab"
                onClick={() => setActiveFloor(isActive ? null : floor)}
                style={{
                  borderColor: isActive ? colors.active : colors.border,
                  background: isActive ? colors.active : colors.bg,
                  color: isActive ? '#fff' : colors.text,
                }}
              >
                {floorLabel(floor)}
                <span className="floor-tab-count" style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : colors.border,
                  color: isActive ? '#fff' : colors.text,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="content-area">

        {/* LEFT: patient list */}
        <div className="patient-list">
          <div className="list-header">
            <span className="list-header-label">
              {activeFloor ? `${floorLabel(activeFloor)} (${filteredPatients.length})` : `Patients (${patients.length})`}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 16, fontSize: 13, color: '#A8A59F' }}>Loading…</div>
          ) : filteredPatients.length === 0 ? (
            <div className="empty-floor">No patients on this floor</div>
          ) : (
            // When a floor is active, show flat list. When "All", group by floor.
            activeFloor ? (
              filteredPatients.map(p => <PatientCard key={p.id} p={p} selected={selected} onSelect={setSelected} />)
            ) : (
              floors.map(({ floor, colors }, idx) => {
                const floorPatients = filteredPatients.filter(p => getFloor(p.room) === floor);
                if (floorPatients.length === 0) return null;
                return (
                  <div key={floor}>
                    <div className="floor-section-header">
                      <span style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: 2,
                        background: colors.active, flexShrink: 0,
                      }} />
                      {floorLabel(floor)}
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: colors.active }}>
                        {floorPatients.length}
                      </span>
                    </div>
                    {floorPatients.map(p => <PatientCard key={p.id} p={p} selected={selected} onSelect={setSelected} />)}
                  </div>
                );
              })
            )
          )}
        </div>

        {/* CENTER: patient detail */}
        <div className="detail-pane">
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A8A59F', fontSize: 13 }}>
              Select a patient to view details
            </div>
          ) : (() => {
            const priority = (selected.priority ?? 0) as Priority;
            const c = P[priority];
            const initials = selected.name.split(' ').map(n => n[0]).join('').slice(0, 2);
            const floor = getFloor(selected.room);
            const floorColorIdx = floors.findIndex(f => f.floor === floor);
            const floorColors = FLOOR_COLORS[floorColorIdx % FLOOR_COLORS.length] ?? FLOOR_COLORS[0];
            return (
              <>
                <div className="patient-header">
                  <div className="big-avatar" style={{ background: c.badge, color: c.badgeText }}>{initials}</div>
                  <div className="patient-meta">
                    <h2>{selected.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#6B6860' }}>Room {selected.room} · Age {selected.age} · {selected.id}</span>
                      <span
                        className="floor-badge"
                        style={{ background: floorColors.bg, color: floorColors.text, border: `1px solid ${floorColors.border}` }}
                      >
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 1, background: floorColors.active }} />
                        {floorLabel(floor)}
                      </span>
                    </div>
                  </div>
                  <div className="action-row">
                    <Link href={`/patients/${selected.id}`} className="link-btn primary" style={{ textDecoration: 'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>
                      AI Analysis
                    </Link>
                  </div>
                </div>

                <div className="info-grid">
                  <div className="info-card">
                    <div className="info-card-label">Allergies</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {selected.allergies.filter(a => a !== 'None').length === 0
                        ? <span style={{ fontSize: 12, color: '#A8A59F' }}>None recorded</span>
                        : selected.allergies.filter(a => a !== 'None').map(a => (
                          <span key={a} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F5C4C4', fontWeight: 500 }}>{a}</span>
                        ))
                      }
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-card-label">Conditions</div>
                    <div>
                      {selected.conditions.slice(0, 3).map(cond => (
                        <div key={cond} className="condition-item">{cond}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-card-label">Medications</div>
                  <div>
                    {selected.medications.filter(m => m !== 'None').length === 0
                      ? <span style={{ fontSize: 12, color: '#A8A59F' }}>None recorded</span>
                      : selected.medications.filter(m => m !== 'None').map(m => (
                        <span key={m} className="med-chip">{m}</span>
                      ))
                    }
                  </div>
                </div>

                <div style={{ background: '#E1F5EE', border: '1px solid #b2ddb2', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#0F6E56', marginBottom: 4 }}>Priority Level</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PriorityBadge priority={priority} />
                    <div style={{ display: 'flex', gap: 5 }}>
                      {([0, 1, 2, 3] as Priority[]).map(level => {
                        const lc = P[level];
                        const isAct = priority === level;
                        return (
                          <button
                            key={level}
                            className={`priority-dot-btn ${isAct ? 'active' : ''}`}
                            style={{
                              borderColor: isAct ? lc.dot : 'rgba(168,162,158,0.22)',
                              background: isAct ? lc.dot : 'transparent',
                              width: isAct ? 18 : 12, height: isAct ? 18 : 12,
                            }}
                            onClick={() => handlePriority(selected.id, level)}
                            title={lc.label}
                          />
                        );
                      })}
                    </div>
                    <Link href={`/patients/${selected.id}`} style={{ marginLeft: 'auto', fontSize: 11, color: '#0F6E56', textDecoration: 'underline' }}>
                      Full AI report →
                    </Link>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* RIGHT: priority summary */}
        <div className="right-panel">
          <div className="rp-section">
            <div className="rp-label">Priority Summary</div>
            {([3, 2, 1, 0] as const).map(level => {
              const count = filteredPatients.filter(p => (p.priority ?? 0) === level).length;
              const total = patients.filter(p => (p.priority ?? 0) === level).length;
              const c = P[level];
              return (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ display: 'inline-block', width: 24, height: 4, borderRadius: 2, background: c.bar, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#1A1A18', flex: 1 }}>{c.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.badgeText, background: c.badge, border: `1px solid ${c.badgeBorder}`, borderRadius: 20, padding: '1px 7px' }}>
                    {activeFloor && count !== total ? `${count}/${total}` : total}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Floor overview */}
          {floors.length > 1 && (
            <div className="rp-section">
              <div className="rp-label">By Floor</div>
              {floors.map(({ floor, count, colors }) => {
                const isActive = activeFloor === floor;
                const floorCrit = patients.filter(p => getFloor(p.room) === floor && (p.priority ?? 0) === 3).length;
                return (
                  <div
                    key={floor}
                    onClick={() => setActiveFloor(isActive ? null : floor)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 8px', marginBottom: 4,
                      borderRadius: 8, cursor: 'pointer',
                      background: isActive ? colors.bg : 'transparent',
                      border: `1px solid ${isActive ? colors.border : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 20, height: 20, borderRadius: 5,
                      background: isActive ? colors.active : colors.bg,
                      color: isActive ? '#fff' : colors.text,
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                    }}>
                      {floor === '?' ? '?' : floor}
                    </span>
                    <span style={{ fontSize: 11, flex: 1, color: isActive ? colors.text : '#1A1A18', fontWeight: isActive ? 600 : 400 }}>
                      {floorLabel(floor)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {floorCrit > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#A32D2D', background: '#FCEBEB', border: '1px solid #F5C4C4', borderRadius: 20, padding: '1px 5px' }}>
                          {floorCrit}⚠
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 20, padding: '1px 6px' }}>
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredPatients.filter(p => (p.priority ?? 0) >= 2).length > 0 && (
            <div className="rp-section">
              <div className="rp-label">Needs Attention</div>
              {filteredPatients.filter(p => (p.priority ?? 0) >= 2).slice(0, 5).map(p => {
                const priority = (p.priority ?? 0) as Priority;
                const c = P[priority];
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #E5E0D6', cursor: 'pointer' }}
                  >
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: c.badge, border: `1px solid ${c.badgeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: c.badgeText, flexShrink: 0 }}>
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: '#6B6860' }}>Rm {p.room}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Extracted patient card to keep JSX clean
function PatientCard({ p, selected, onSelect }: { p: Patient; selected: Patient | null; onSelect: (p: Patient) => void }) {
  const priority = (p.priority ?? 0) as Priority;
  const c = P[priority];
  const initials = p.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const isActive = selected?.id === p.id;
  return (
    <div
      className={`patient-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(p)}
    >
      <div className="pc-left-bar" style={{ background: c.leftBorder }} />
      <div className="pc-top">
        <div className="pc-avatar" style={{ background: c.badge, color: c.badgeText }}>{initials}</div>
        <span className="pc-name">{p.name}</span>
        <PriorityBadge priority={priority} />
      </div>
      <div className="pc-tags">
        {p.allergies.filter(a => a !== 'None').slice(0, 2).map(a => (
          <span key={a} className="tag tag-red">{a}</span>
        ))}
        {p.conditions.slice(0, 1).map(c => (
          <span key={c} className="tag tag-amber">{c.length > 18 ? c.slice(0, 18) + '…' : c}</span>
        ))}
      </div>
    </div>
  );
}