"use client"
import { useState, use, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  getPatientAnalysis, updatePatientPriority, updatePatientBMI,
  calcBMI, bmiCategory, bmiColor,
  PatientAnalysis, Priority, PRIORITY_CONFIG,
} from '@/lib/api';
import { useSettings } from '@/lib/settingsContext';
import {
  AlertTriangle, Sparkles, Check, Pill, ShieldBan,
  ChevronDown, ArrowLeft, Scale, Ruler, FlameKindling, Pencil,
} from 'lucide-react';

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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      borderRadius: 6, height: 14, width: '100%',
      background: 'linear-gradient(90deg,#e7e5e4 25%,#d6d3d1 50%,#e7e5e4 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
  );
}

// ── BMI gauge bar ─────────────────────────────────────────────────────────────
function BMIGauge({ bmi }: { bmi: number }) {
  // Scale: 10 → 40, clamp
  const pct = Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100));
  const cat = bmiCategory(bmi);
  const col = bmiColor(cat);

  const zones = [
    { label: 'Under', from: 0, to: 28.33, color: '#93C5FD' },
    { label: 'Normal', from: 28.33, to: 50, color: '#86EFAC' },
    { label: 'Over', from: 50, to: 66.67, color: '#FCD34D' },
    { label: 'Obese', from: 66.67, to: 100, color: '#FCA5A5' },
  ];

  return (
    <div style={{ marginTop: 8 }}>
      {/* Track */}
      <div style={{ position: 'relative', height: 10, borderRadius: 10, overflow: 'hidden', display: 'flex' }}>
        {zones.map(z => (
          <div key={z.label} style={{ flex: z.to - z.from, background: z.color, opacity: 0.55 }} />
        ))}
        {/* Needle */}
        <div style={{
          position: 'absolute', top: -2, bottom: -2,
          left: `calc(${pct}% - 2px)`, width: 4,
          background: col.text, borderRadius: 4,
          boxShadow: '0 0 4px rgba(0,0,0,0.3)',
          transition: 'left 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: '#A8A59F', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <span>Underweight (&lt;18.5)</span>
        <span>Normal (18.5–25)</span>
        <span>Overweight (25–30)</span>
        <span>Obese (&gt;30)</span>
      </div>
    </div>
  );
}

function BiometricEditor({
  patientId, initialHeight, initialWeight, age,
  onSaved,
}: {
  patientId: string;
  initialHeight: number | null;
  initialWeight: number | null;
  age: number;
  onSaved: (h: number, w: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [height, setHeight] = useState(String(initialHeight ?? ''));
  const [weight, setWeight] = useState(String(initialWeight ?? ''));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const heightRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) setTimeout(() => heightRef.current?.focus(), 50);
  }, [editing]);

  const save = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || h < 50 || h > 250) { setErr('Height must be 50–250 cm'); return; }
    if (!w || w < 10 || w > 400) { setErr('Weight must be 10–400 kg'); return; }
    setErr('');
    setSaving(true);
    try {
      await updatePatientBMI(patientId, { height_cm: h, weight_kg: w });
      onSaved(h, w);
      setEditing(false);
    } catch {
      setErr('Save failed — please retry');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    const hasBoth = initialHeight && initialWeight;
    const bmi = hasBoth ? calcBMI(initialWeight!, initialHeight!) : null;
    const cat = bmi ? bmiCategory(bmi) : null;
    const col = cat ? bmiColor(cat) : null;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {hasBoth ? (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B6860' }}>
              <Ruler style={{ width: 12, height: 12 }} />{initialHeight} cm
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B6860' }}>
              <Scale style={{ width: 12, height: 12 }} />{initialWeight} kg
            </span>
            {bmi && cat && col && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                background: col.bg, color: col.text, border: `1px solid ${col.border}`,
              }}>
                BMI {bmi} · {cat}
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#A8A59F', fontStyle: 'italic' }}>
            No biometrics recorded
          </span>
        )}
        <button
          onClick={() => setEditing(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: '#0F6E56', background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 0', fontFamily: 'inherit',
          }}
        >
          <Pencil style={{ width: 11, height: 11 }} />
          {hasBoth ? 'Edit' : 'Add biometrics'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: '#A8A59F', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Height (cm)
          </label>
          <input
            ref={heightRef}
            type="number" value={height} min={50} max={250} step={0.1}
            onChange={e => setHeight(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            style={{
              width: 90, border: '1.5px solid #E5E0D6', borderRadius: 8,
              padding: '6px 10px', fontSize: 13, fontFamily: 'inherit',
              color: '#1A1A18', background: '#F9F6F1', outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = '#52B788')}
            onBlur={e => (e.target.style.borderColor = '#E5E0D6')}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: '#A8A59F', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Weight (kg)
          </label>
          <input
            type="number" value={weight} min={10} max={400} step={0.1}
            onChange={e => setWeight(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            style={{
              width: 90, border: '1.5px solid #E5E0D6', borderRadius: 8,
              padding: '6px 10px', fontSize: 13, fontFamily: 'inherit',
              color: '#1A1A18', background: '#F9F6F1', outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = '#52B788')}
            onBlur={e => (e.target.style.borderColor = '#E5E0D6')}
          />
        </div>

        {/* Live BMI preview */}
        {height && weight && (() => {
          const h = parseFloat(height); const w = parseFloat(weight);
          if (!h || !w || h < 50 || w < 10) return null;
          const bmi = calcBMI(w, h);
          const cat = bmiCategory(bmi);
          const col = bmiColor(cat);
          return (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, alignSelf: 'flex-end', marginBottom: 2,
              background: col.bg, color: col.text, border: `1px solid ${col.border}`,
            }}>
              BMI {bmi} · {cat}
            </span>
          );
        })()}

        <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end', marginBottom: 0 }}>
          <button
            onClick={save} disabled={saving}
            style={{
              padding: '6px 14px', background: '#1C2B22', color: '#52B788',
              border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => { setEditing(false); setErr(''); }}
            style={{
              padding: '6px 10px', background: 'transparent', color: '#6B6860',
              border: '1px solid #E5E0D6', borderRadius: 8, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
      {err && <span style={{ fontSize: 11, color: '#A32D2D' }}>{err}</span>}
      <span style={{ fontSize: 11, color: '#A8A59F' }}>
        Age {age} · Calorie target auto-calculated via Mifflin-St Jeor (sedentary/bed-rest)
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { energyUnit } = useSettings();

  const [analysis, setAnalysis] = useState<PatientAnalysis | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [currentPriority, setCurrentPriority] = useState<Priority>(0);

  const [localHeight, setLocalHeight] = useState<number | null>(null);
  const [localWeight, setLocalWeight] = useState<number | null>(null);

  useEffect(() => {
    getPatientAnalysis(id)
      .then(data => {
        setAnalysis(data);
        setCurrentPriority((data.patient.priority ?? 0) as Priority);
        setLocalHeight(data.patient.height_cm ?? null);
        setLocalWeight(data.patient.weight_kg ?? null);
        setTimeout(() => setLoading(false), 300);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!loading && analysis) requestAnimationFrame(() => setVisible(true));
  }, [loading, analysis]);

  useEffect(() => {
    const h = () => setPriorityOpen(false);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const handlePriorityChange = async (priority: Priority) => {
    setPriorityOpen(false);
    setCurrentPriority(priority);
    try { await updatePatientPriority(id, priority); } catch { }
  };

  const handleBiometricSaved = async (h: number, w: number) => {
    setLocalHeight(h);
    setLocalWeight(w);
    setLoading(true);
    setVisible(false);
    try {
      const fresh = await getPatientAnalysis(id);
      setAnalysis(fresh);
      setLocalHeight(fresh.patient.height_cm ?? h);
      setLocalWeight(fresh.patient.weight_kg ?? w);
    } catch { /* keep stale */ }
    finally {
      setLoading(false);
      requestAnimationFrame(() => setVisible(true));
    }
  };

  const safeCount = useCountUp(analysis?.safeFoods.length ?? 0, 900, visible);
  const flagCount = useCountUp(analysis?.flaggedFoods.length ?? 0, 900, visible);
  const medCount = useCountUp(analysis?.patient.medications.length ?? 0, 900, visible);
  const kcalCount = useCountUp(analysis?.targetCalories ?? 0, 1000, visible);
  const cfg = PRIORITY_CONFIG[currentPriority];

  // Derived biometrics
  const bmi = localHeight && localWeight ? calcBMI(localWeight, localHeight) : null;
  const bmCat = bmi ? bmiCategory(bmi) : (analysis?.bmiCategory ?? 'Unknown');
  const bmCol = bmiColor(bmCat);

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderBottom: '1px solid #E5E0D6', background: '#fff' }}>
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 500 }}>
          Supa<span style={{ color: '#52B788' }}>care</span>
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 32, border: '1px solid #E5E0D6', background: '#fff', borderRadius: 12 }}>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, marginBottom: 8 }}>Patient Not Found</h2>
          <p style={{ fontSize: 13, color: '#6B6860' }}>Unable to load patient data.</p>
          <Link href="/patients" style={{ display: 'inline-block', marginTop: 12, fontSize: 12, color: '#0F6E56' }}>← Back to patients</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes shimmer    { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes chipPop    { 0%{opacity:0;transform:scale(0.85)} 70%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bmiSlide   { from{width:0} }

        .topbar        { display:flex; align-items:center; gap:12px; padding:14px 24px; border-bottom:1px solid #E5E0D6; background:#fff; flex-shrink:0; }
        .content-area  { display:flex; flex:1; overflow:hidden; min-height:0; }
        .detail-pane   { flex:1; min-width:0; overflow-y:auto; padding:24px 28px; display:flex; flex-direction:column; gap:16px; }
        .right-panel   { width:220px; border-left:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; padding:16px; }
        .rp-label      { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:10px; }
        .rp-section    { margin-bottom:20px; }

        .info-card       { background:#fff; border:1px solid #E5E0D6; border-radius:12px; padding:16px; transition:box-shadow 0.2s,transform 0.2s; }
        .info-card:hover { box-shadow:0 4px 20px rgba(28,25,23,0.07); transform:translateY(-1px); }
        .info-card-title { font-family:'Fraunces',serif; font-size:15px; color:#1A1A18; margin-bottom:12px; display:flex; align-items:center; gap:6px; }

        .ai-summary-text { font-size:15px; font-family:'Fraunces',serif; font-style:italic; color:#1A1A18; line-height:1.6; word-break:break-word; overflow-wrap:anywhere; }

        .safe-chip       { display:inline-flex; align-items:center; gap:5px; font-size:12px; color:#0F6E56; border:1px solid rgba(15,110,86,0.2); background:rgba(15,110,86,0.05); padding:5px 12px; border-radius:20px; font-weight:500; transition:background 0.15s,transform 0.15s; }
        .safe-chip:hover { background:rgba(15,110,86,0.1); transform:translateY(-1px); }

        .med-row           { padding:9px 10px; border-top:1px solid #E5E0D6; }
        .med-row:last-child{ border-bottom:1px solid #E5E0D6; }
        .flag-item           { padding:9px 0; border-top:1px solid rgba(200,50,50,0.1); }
        .flag-item:last-child{ border-bottom:1px solid rgba(200,50,50,0.1); }

        .priority-selector  { display:inline-flex; align-items:center; gap:6px; font-size:11px; letter-spacing:0.07em; text-transform:uppercase; font-weight:500; padding:4px 10px; border-radius:20px; border:1px solid; cursor:pointer; transition:filter 0.15s; position:relative; }
        .priority-selector:hover { filter:brightness(0.9); }
        .priority-dropdown  { position:absolute; top:calc(100% + 6px); right:0; z-index:50; background:#fff; border:1px solid #E5E0D6; border-radius:10px; box-shadow:0 8px 24px rgba(28,25,23,0.1); padding:4px; min-width:130px; }
        .priority-option    { display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:6px; font-size:12px; cursor:pointer; transition:background 0.12s; border:none; background:transparent; width:100%; text-align:left; font-family:inherit; }
        .priority-option:hover { background:rgba(28,25,23,0.05); }

        .stagger-1 { animation:fadeUp 0.4s ease 0.05s forwards; opacity:0; }
        .stagger-2 { animation:fadeUp 0.4s ease 0.15s forwards; opacity:0; }
        .stagger-3 { animation:fadeUp 0.4s ease 0.25s forwards; opacity:0; }
        .stagger-4 { animation:fadeUp 0.4s ease 0.35s forwards; opacity:0; }
        .stagger-5 { animation:fadeUp 0.4s ease 0.45s forwards; opacity:0; }
        .stagger-6 { animation:fadeUp 0.4s ease 0.55s forwards; opacity:0; }
      `}</style>

      {/* Topbar */}
      <div className="topbar">
        <Link href="/patients" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B6860', textDecoration: 'none' }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Patients
        </Link>
        <div style={{ width: 1, height: 16, background: '#E5E0D6' }} />
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 500, flex: 1 }}>
          Supa<span style={{ color: '#52B788' }}>care</span>
        </span>
        {!loading && analysis && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Priority selector */}
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button
                className="priority-selector"
                style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                onClick={() => setPriorityOpen(v => !v)}
              >
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: cfg.dotColor }} />
                {cfg.label}
                <ChevronDown style={{ width: 10, height: 10, opacity: 0.6 }} />
              </button>
              {priorityOpen && (
                <div className="priority-dropdown">
                  {([0, 1, 2, 3] as Priority[]).map(level => {
                    const c = PRIORITY_CONFIG[level];
                    return (
                      <button key={level} className="priority-option" style={{ color: c.color, fontWeight: currentPriority === level ? 500 : 400 }} onClick={() => handlePriorityChange(level)}>
                        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: c.dotColor }} />
                        {c.label}
                        {currentPriority === level && <span style={{ marginLeft: 'auto', fontSize: '0.6rem', opacity: 0.5 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <span style={{ fontSize: 12, color: '#6B6860' }}>Room {analysis.patient.room}</span>
            <span style={{ fontSize: 11, color: '#A8A59F', fontFamily: 'monospace' }}>{analysis.patient.id}</span>
          </div>
        )}
      </div>

      <div className="content-area">
        <div className="detail-pane">

          {/* ── Patient header ── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton style={{ width: 120, height: 10 }} />
              <Skeleton style={{ width: 260, height: 32, marginTop: 4 }} />
            </div>
          ) : (
            <div className="stagger-1">
              <div style={{ fontSize: 11, color: '#A8A59F', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
                Patient Record
              </div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 500, color: '#1A1A18', lineHeight: 1.1 }}>
                {analysis!.patient.name}
              </h1>
              <p style={{ fontSize: 13, color: '#6B6860', marginTop: 4 }}>
                Age {analysis!.patient.age} · EHR {analysis!.patient.id}
              </p>
              {/* Inline biometric editor */}
              <div style={{ marginTop: 10 }}>
                <BiometricEditor
                  patientId={id}
                  initialHeight={localHeight}
                  initialWeight={localWeight}
                  age={analysis!.patient.age}
                  onSaved={handleBiometricSaved}
                />
              </div>
            </div>
          )}

          {/* ── Stat cards ── */}
          {!loading && (
            <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: 'Medications', value: medCount },
                { label: 'Safe Foods', value: safeCount },
                { label: 'Flagged Foods', value: flagCount },
                { label: `Daily Target`, value: `${kcalCount}\u202f${energyUnit === 'kJ' ? 'kJ' : 'kcal'}`, raw: true },
              ].map((stat) => (
                <div key={stat.label} style={{ background: '#fff', border: '1px solid #E5E0D6', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: '#A8A59F', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: stat.raw ? '1.3rem' : '2rem', lineHeight: 1, color: '#1A1A18' }}>
                    {stat.raw
                      ? (energyUnit === 'kJ'
                        ? `${Math.round((analysis?.targetCalories ?? 0) * 4.184)}\u202fkJ`
                        : `${analysis?.targetCalories ?? 0}\u202fkcal`)
                      : stat.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BMI card ── */}
          {!loading && (
            <div className="stagger-3" style={{
              background: bmCol.bg, border: `1px solid ${bmCol.border}`,
              borderRadius: 12, padding: '16px 20px',
              width: '100%', boxSizing: 'border-box',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Scale style={{ width: 14, height: 14, color: bmCol.text }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: bmCol.text, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Body Mass Index
                  </span>
                </div>
                {bmi ? (
                  <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 500, color: bmCol.text }}>
                    {bmi} <span style={{ fontSize: 13, fontWeight: 400 }}>kg/m²</span>
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#A8A59F', fontStyle: 'italic' }}>
                    Add height &amp; weight above to calculate BMI
                  </span>
                )}
              </div>

              {bmi && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                      background: '#fff', color: bmCol.text, border: `1.5px solid ${bmCol.border}`,
                    }}>
                      {bmCat}
                    </span>
                    <span style={{ fontSize: 12, color: bmCol.text }}>
                      {bmCat === 'Underweight' && 'Meals are calorie-dense to support weight gain.'}
                      {bmCat === 'Normal weight' && 'Balanced standard hospital portions assigned.'}
                      {bmCat === 'Overweight' && 'Portions reduced; lean proteins and fibre prioritised.'}
                      {bmCat === 'Obese' && 'Low-GI, high-protein meals with reduced calories.'}
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: bmCol.text }}>
                      <FlameKindling style={{ width: 12, height: 12 }} />
                      Target: {analysis!.targetCalories} kcal/day
                    </div>
                  </div>
                  <BMIGauge bmi={bmi} />
                </>
              )}
            </div>
          )}

          {/* ── AI Summary ── */}
          {loading ? (
            <div style={{ padding: 20, border: '1px solid #E5E0D6', borderRadius: 12, background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} style={{ width: i === 3 ? '60%' : '100%', height: 12 }} />)}
            </div>
          ) : (
            <div className="stagger-4" style={{
              background: 'linear-gradient(135deg,#fdf8f0,#faf4e8)',
              border: '1px solid rgba(181,100,27,0.15)',
              borderRadius: 12, padding: '18px 20px',
              width: '100%', boxSizing: 'border-box', position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 10, right: 14, opacity: 0.06, pointerEvents: 'none' }}>
                <Sparkles style={{ width: 64, height: 64, color: '#7A3E0D' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Sparkles style={{ width: 13, height: 13, color: '#B5641B' }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#B5641B', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    AI Nutritional Summary
                  </span>
                </div>
                <p className="ai-summary-text">"{analysis!.summary}"</p>
              </div>
            </div>
          )}

          {/* ── Medications + Blocked foods ── */}
          <div className="stagger-5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {loading ? (
              <>
                <div className="info-card"><Skeleton style={{ width: 120, marginBottom: 12 }} />{[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 40, marginBottom: 4 }} />)}</div>
                <div className="info-card"><Skeleton style={{ width: 100, marginBottom: 12 }} />{[1, 2].map(i => <Skeleton key={i} style={{ height: 48, marginBottom: 4 }} />)}</div>
              </>
            ) : (
              <>
                <div className="info-card">
                  <div className="info-card-title"><Pill style={{ width: 16, height: 16, color: '#A8A59F' }} />Active EHR Monitors</div>
                  {analysis!.patient.medications.map(med => (
                    <div key={med} className="med-row" style={{ background: ['Warfarin', 'Lisinopril', 'MAOI'].includes(med) ? 'rgba(200,50,50,0.03)' : 'transparent' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1A1A18' }}>{med}</p>
                      {med === 'Warfarin' && <p style={{ fontSize: 11, color: '#A32D2D', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle style={{ width: 10, height: 10 }} /> Avoid High Vitamin K</p>}
                      {med === 'Lisinopril' && <p style={{ fontSize: 11, color: '#B5641B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle style={{ width: 10, height: 10 }} /> Monitor Potassium</p>}
                      {med === 'MAOI' && <p style={{ fontSize: 11, color: '#A32D2D', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle style={{ width: 10, height: 10 }} /> Tyramine restriction</p>}
                    </div>
                  ))}
                </div>

                <div className="info-card" style={{ borderColor: 'rgba(163,45,45,0.2)', background: 'rgba(252,235,235,0.5)' }}>
                  <div className="info-card-title" style={{ color: '#7f1d1d' }}><ShieldBan style={{ width: 16, height: 16, color: '#fca5a5' }} />Blocked Foods</div>
                  {analysis!.flaggedFoods.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#A8A59F' }}>No foods blocked from current inventory.</p>
                  ) : (
                    analysis!.flaggedFoods.map((flag, i) => (
                      <div key={i} className="flag-item">
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#7f1d1d' }}>{flag.item.name}</span>
                        <p style={{ fontSize: 11, color: '#A32D2D', marginTop: 2, lineHeight: 1.5 }}>{flag.reason}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Safe foods ── */}
          {loading ? (
            <div className="info-card">
              <Skeleton style={{ width: 140, marginBottom: 12 }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} style={{ width: 80, height: 28, borderRadius: 20 }} />)}
              </div>
            </div>
          ) : (
            <div className="stagger-6 info-card">
              <div className="info-card-title"><Check style={{ width: 16, height: 16, color: '#52B788' }} />AI-Approved Inventory</div>
              <div style={{ height: 1, background: '#E5E0D6', marginBottom: 12 }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {analysis!.safeFoods.map((food, i) => (
                  <span key={food.id} className="safe-chip" style={{ animation: `chipPop 0.35s ease ${0.45 + i * 0.04}s forwards`, opacity: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#52B788', display: 'inline-block' }} />
                    {food.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Right sidebar ── */}
        <div className="right-panel">
          {!loading && analysis && (
            <>
              <div className="rp-section">
                <div className="rp-label">Patient Info</div>
                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Age', value: `${analysis.patient.age} yrs` },
                    { label: 'Room', value: analysis.patient.room },
                    { label: 'Height', value: localHeight ? `${localHeight} cm` : '—' },
                    { label: 'Weight', value: localWeight ? `${localWeight} kg` : '—' },
                    { label: 'BMI', value: bmi ? `${bmi}` : '—', color: bmCol.text },
                    { label: 'Category', value: bmCat, color: bmCol.text },
                    { label: 'Kcal/day', value: `${analysis.targetCalories}`, color: '#0F6E56' },
                    { label: 'Medications', value: `${analysis.patient.medications.length}` },
                    { label: 'Safe foods', value: `${analysis.safeFoods.length}`, color: '#0F6E56' },
                    { label: 'Flagged', value: `${analysis.flaggedFoods.length}`, color: analysis.flaggedFoods.length > 0 ? '#A32D2D' : '#0F6E56' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B6860' }}>{row.label}</span>
                      <span style={{ fontWeight: 500, color: (row as any).color ?? '#1A1A18' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {analysis.patient.allergies.filter(a => a !== 'None').length > 0 && (
                <div className="rp-section">
                  <div className="rp-label">Allergies</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {analysis.patient.allergies.filter(a => a !== 'None').map(a => (
                      <span key={a} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F5C4C4', fontWeight: 500 }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.flaggedFoods.length > 0 && (
                <div className="rp-section">
                  <div className="rp-label">Flagged Items</div>
                  {analysis.flaggedFoods.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '5px 0', borderBottom: '1px solid #E5E0D6' }}>
                      <AlertTriangle style={{ width: 11, height: 11, color: '#A32D2D', flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#A32D2D' }}>{f.item.name}</div>
                        <div style={{ fontSize: 10, color: '#6B6860', lineHeight: 1.4 }}>{f.reason.slice(0, 60)}{f.reason.length > 60 ? '…' : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}