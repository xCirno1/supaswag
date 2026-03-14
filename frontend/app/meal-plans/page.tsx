"use client"
import { useState, useEffect } from 'react';
import { getMealNutritionAnalysis, getMealPlans, MealPlan } from '@/lib/api';
import { useSettings } from '@/lib/settingsContext';
import { displayEnergy } from '@/lib/units';
import { Sparkles, AlertTriangle, X, ChevronRight, Flame, Wheat, Droplets, Beef, Leaf } from 'lucide-react';

const MEAL_ICONS = ['🌅', '☀️', '🌙'];
const MEAL_TIMES = ['Breakfast · 7:30', 'Lunch · 12:00', 'Dinner · 17:30'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface MealNutrition {
  mealName: string;
  totalCalories: number;
  servingSize: string;
  macros: {
    protein: { grams: number; pct: number };
    carbs: { grams: number; pct: number };
    fat: { grams: number; pct: number };
    fiber: { grams: number };
  };
  micros: { name: string; amount: string; unit: string; rdaPct: number }[];
  highlights: string[];
  clinicalNotes: string;
  allergenWarnings: string[];
  glycemicIndex: 'Low' | 'Medium' | 'High';
  suitableFor: string[];
  keyIngredients: string[];
}

const GI_COLORS = {
  Low: { bg: '#D8EED8', text: '#1A4731', border: '#b2ddb2' },
  Medium: { bg: '#FAEEDA', text: '#7A3E0D', border: '#f5d5b5' },
  High: { bg: '#FCEBEB', text: '#A32D2D', border: '#F5C4C4' },
};

function MacroBar({ label, grams, pct, color, icon }: {
  label: string; grams: number; pct: number; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color, display: 'flex' }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1A18' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#6B6860' }}>{grams}g</span>
          <span style={{ fontSize: 11, fontWeight: 600, color }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 6, background: '#E5E0D6', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          height: 6, borderRadius: 6, background: color,
          width: `${Math.min(100, pct)}%`,
          transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
    </div>
  );
}

function NutritionPanel({
  mealName, mealType, plan, kcal, onClose,
}: {
  mealName: string; mealType: string; plan: MealPlan; kcal: number; onClose: () => void;
}) {
  const [nutrition, setNutrition] = useState<MealNutrition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getMealNutritionAnalysis({
      mealName, mealType, kcal,
      patientConditions: plan.flags.map(f => f.reason),
      patientAllergies: [],
      patientMedications: [],
    })
      .then(data => { setNutrition(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [mealName]);

  const giColors = nutrition ? GI_COLORS[nutrition.glycemicIndex] ?? GI_COLORS.Medium : GI_COLORS.Medium;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(15,20,17,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, animation: 'overlayIn 0.2s ease',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        @keyframes panelIn { from{opacity:0;transform:scale(0.95) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .nutr-panel {
          background: #F9F6F1;
          border: 1px solid #E5E0D6;
          border-radius: 20px;
          width: 100%; max-width: 520px; max-height: 90vh;
          overflow: hidden; display: flex; flex-direction: column;
          animation: panelIn 0.28s cubic-bezier(0.34,1.1,0.64,1);
          box-shadow: 0 28px 80px rgba(15,20,17,0.3);
        }
        .nutr-header {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 20px 20px 16px;
          background: #fff; border-bottom: 1px solid #E5E0D6;
          flex-shrink: 0;
        }
        .nutr-body { flex: 1; overflow-y: auto; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
        .nutr-card { background: #fff; border: 1px solid #E5E0D6; border-radius: 12px; padding: 14px 16px; }
        .nutr-card-label { font-size: 10px; font-weight: 600; color: #A8A59F; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }

        .skel { border-radius: 6px; background: linear-gradient(90deg,#e7e5e4 25%,#d6d3d1 50%,#e7e5e4 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }

        .micro-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #F0EDE8; }
        .micro-row:last-child { border-bottom: none; }
        .micro-bar-wrap { flex: 1; height: 4px; background: #E5E0D6; border-radius: 4px; overflow: hidden; }
        .micro-bar { height: 4px; border-radius: 4px; }

        .highlight-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 0; }
        .ingredient-pill { display: inline-flex; font-size: 11px; padding: 3px 10px; border-radius: 20px; background: #F0FAF4; color: '#0F6E56'; border: 1px solid #b2ddb2; margin: 3px; }
      `}</style>

      <div className="nutr-panel">
        {/* Header */}
        <div className="nutr-header">
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#D8EED8,#E1F5EE)',
            border: '1px solid #b2ddb2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {mealType === 'Breakfast' ? '🌅' : mealType === 'Lunch' ? '☀️' : '🌙'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#0F6E56', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
              {mealType} · Nutritional Facts
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, color: '#1A1A18', lineHeight: 1.3 }}>
              {mealName}
            </div>
            {!loading && nutrition && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0F6E56' }}>
                  {nutrition.totalCalories} kcal
                </span>
                <span style={{ fontSize: 10, color: '#A8A59F' }}>·</span>
                <span style={{ fontSize: 11, color: '#6B6860' }}>{nutrition.servingSize}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  background: giColors.bg, color: giColors.text, border: `1px solid ${giColors.border}`,
                }}>
                  GI: {nutrition.glycemicIndex}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6860', padding: 4, flexShrink: 0 }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body */}
        <div className="nutr-body">
          {loading ? (
            <>
              <div className="nutr-card">
                <div className="nutr-card-label">Macronutrients</div>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div className="skel" style={{ width: 80, height: 12 }} />
                      <div className="skel" style={{ width: 40, height: 12 }} />
                    </div>
                    <div className="skel" style={{ height: 6 }} />
                  </div>
                ))}
              </div>
              <div className="nutr-card">
                <div className="nutr-card-label">Micronutrients</div>
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skel" style={{ height: 10, marginBottom: 8 }} />)}
              </div>
            </>
          ) : error ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#A32D2D', fontSize: 13 }}>
              Failed to load nutritional data. Please try again.
            </div>
          ) : nutrition ? (
            <>
              {/* Macros */}
              <div className="nutr-card" style={{ animation: 'fadeUp 0.35s ease 0.05s forwards', opacity: 0 }}>
                <div className="nutr-card-label">Macronutrients</div>
                <MacroBar label="Protein" grams={nutrition.macros.protein.grams} pct={nutrition.macros.protein.pct} color="#0F6E56" icon={<Beef style={{ width: 13, height: 13 }} />} />
                <MacroBar label="Carbohydrates" grams={nutrition.macros.carbs.grams} pct={nutrition.macros.carbs.pct} color="#B5641B" icon={<Wheat style={{ width: 13, height: 13 }} />} />
                <MacroBar label="Fat" grams={nutrition.macros.fat.grams} pct={nutrition.macros.fat.pct} color="#7A3E0D" icon={<Droplets style={{ width: 13, height: 13 }} />} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 8, borderTop: '1px solid #E5E0D6' }}>
                  <Leaf style={{ width: 12, height: 12, color: '#52B788' }} />
                  <span style={{ fontSize: 12, color: '#6B6860' }}>Dietary Fibre: <strong style={{ color: '#1A1A18' }}>{nutrition.macros.fiber.grams}g</strong></span>
                </div>
              </div>

              {/* Micros */}
              <div className="nutr-card" style={{ animation: 'fadeUp 0.35s ease 0.12s forwards', opacity: 0 }}>
                <div className="nutr-card-label">Micronutrients</div>
                {nutrition.micros.map((micro, i) => (
                  <div key={i} className="micro-row">
                    <span style={{ fontSize: 12, color: '#1A1A18', flex: 1 }}>{micro.name}</span>
                    <span style={{ fontSize: 11, color: '#6B6860', width: 60, textAlign: 'right' }}>{micro.amount} {micro.unit}</span>
                    <div className="micro-bar-wrap">
                      <div className="micro-bar" style={{
                        width: `${Math.min(100, micro.rdaPct)}%`,
                        background: micro.rdaPct >= 25 ? '#52B788' : micro.rdaPct >= 10 ? '#EF9F27' : '#d6d3d1',
                      }} />
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, width: 36, textAlign: 'right',
                      color: micro.rdaPct >= 25 ? '#0F6E56' : micro.rdaPct >= 10 ? '#B5641B' : '#A8A59F',
                    }}>
                      {micro.rdaPct}%
                    </span>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: '#A8A59F', marginTop: 6 }}>% of recommended daily allowance</div>
              </div>

              {/* Highlights */}
              {nutrition.highlights.length > 0 && (
                <div className="nutr-card" style={{ background: 'linear-gradient(135deg,#D8EED8,#E1F5EE)', borderColor: '#b2ddb2', animation: 'fadeUp 0.35s ease 0.18s forwards', opacity: 0 }}>
                  <div className="nutr-card-label" style={{ color: '#0F6E56' }}>Nutritional Highlights</div>
                  {nutrition.highlights.map((h, i) => (
                    <div key={i} className="highlight-item">
                      <span style={{ color: '#0F6E56', fontSize: 12, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 12, color: '#1A4731', lineHeight: 1.5 }}>{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Clinical notes */}
              {nutrition.clinicalNotes && (
                <div className="nutr-card" style={{ background: '#FAEEDA', borderColor: '#f5d5b5', animation: 'fadeUp 0.35s ease 0.24s forwards', opacity: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Sparkles style={{ width: 12, height: 12, color: '#B5641B' }} />
                    <div className="nutr-card-label" style={{ color: '#7A3E0D', margin: 0 }}>Clinical Notes</div>
                  </div>
                  <p style={{ fontSize: 12, color: '#7A3E0D', lineHeight: 1.6, fontStyle: 'italic' }}>
                    {nutrition.clinicalNotes}
                  </p>
                </div>
              )}

              {/* Allergens */}
              {nutrition.allergenWarnings.length > 0 && (
                <div className="nutr-card" style={{ background: '#FCEBEB', borderColor: '#F5C4C4', animation: 'fadeUp 0.35s ease 0.28s forwards', opacity: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <AlertTriangle style={{ width: 12, height: 12, color: '#A32D2D' }} />
                    <div className="nutr-card-label" style={{ color: '#A32D2D', margin: 0 }}>Allergen Warnings</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {nutrition.allergenWarnings.map((a, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: '#fff', color: '#A32D2D', border: '1px solid #F5C4C4', fontWeight: 500 }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key ingredients */}
              {nutrition.keyIngredients.length > 0 && (
                <div className="nutr-card" style={{ animation: 'fadeUp 0.35s ease 0.32s forwards', opacity: 0 }}>
                  <div className="nutr-card-label">Key Ingredients</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {nutrition.keyIngredients.map((ing, i) => (
                      <span key={i} className="ingredient-pill" style={{ color: '#0F6E56' }}>{ing}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function MealPlansPage() {
  const { energyUnit } = useSettings();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selected, setSelected] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nutritionPanel, setNutritionPanel] = useState<{
    mealName: string; mealType: string; kcal: number;
  } | null>(null);

  useEffect(() => {
    getMealPlans()
      .then(data => { setMealPlans(data); if (data.length > 0) setSelected(data[0]); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const flaggedCount = mealPlans.reduce((acc, m) => acc + m.flags.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes chipPop { 0%{opacity:0;transform:scale(0.85)} 70%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
        @keyframes reasonIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

        .topbar { display:flex; align-items:center; gap:12px; padding:14px 24px; border-bottom:1px solid #E5E0D6; background:#fff; flex-shrink:0; }
        .topbar-title { font-family:'Fraunces',serif; font-size:18px; font-weight:500; color:#1A1A18; flex:1; }
        .topbar-title span { color:#52B788; }
        .content-area { display:flex; flex:1; overflow:hidden; }

        .patient-list { width:260px; border-right:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; }
        .list-header  { padding:14px 16px 8px; display:flex; align-items:center; justify-content:space-between; }
        .list-header-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; }

        .patient-card { padding:10px 16px; border-bottom:1px solid #E5E0D6; cursor:pointer; transition:background 0.1s; position:relative; }
        .patient-card:hover  { background:#F9F6F1; }
        .patient-card.active { background:#E1F5EE; }
        .pc-left   { position:absolute; left:0; top:8px; bottom:8px; width:3px; border-radius:0 2px 2px 0; }
        .pc-top    { display:flex; align-items:center; gap:8px; margin-bottom:3px; }
        .pc-avatar { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:500; flex-shrink:0; }
        .pc-name   { font-size:13px; font-weight:500; color:#1A1A18; flex:1; }
        .pc-sub    { font-size:11px; color:#6B6860; display:flex; align-items:center; gap:5px; }

        .detail-pane { flex:1; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:16px; }
        .info-card   { background:#fff; border:1px solid #E5E0D6; border-radius:12px; padding:16px; }
        .info-card-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:12px; }
        .section-title   { font-family:'Fraunces',serif; font-size:16px; font-weight:500; color:#1A1A18; margin-bottom:12px; }

        .meal-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }

        /* Clickable meal card */
        .meal-card {
          background:#F9F6F1; border-radius:10px; padding:12px;
          border:1px solid #E5E0D6;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s, background 0.15s;
          position: relative;
          overflow: hidden;
        }
        .meal-card:hover {
          border-color:#52B788;
          box-shadow: 0 4px 16px rgba(82,183,136,0.15);
          transform: translateY(-2px);
          background: #F0FAF4;
        }
        .meal-card:hover .meal-card-cta { opacity: 1; }
        .meal-card-cta {
          position: absolute; bottom: 8px; right: 8px;
          display: flex; align-items: center; gap: 3px;
          font-size: 9px; font-weight: 600; color: #0F6E56;
          letter-spacing: 0.08em; text-transform: uppercase;
          opacity: 0; transition: opacity 0.15s;
        }

        .meal-time { font-size:10px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:4px; }
        .meal-name { font-size:13px; font-weight:500; margin-bottom:4px; }
        .meal-desc { font-size:11px; color:#6B6860; line-height:1.5; }
        .meal-cals { font-size:11px; color:#0F6E56; font-weight:500; margin-top:6px; }

        .flag-pill { display:inline-flex; align-items:center; gap:5px; font-size:11px; color:#B5641B; background:#FAEEDA; border:1px solid #f5d5b5; border-radius:20px; padding:3px 9px; margin:3px; }

        .reason-box {
          display:flex; gap:10px; align-items:flex-start;
          background:#F0FAF4; border:1px solid #b2ddb2; border-radius:10px;
          padding:12px 14px;
          animation: reasonIn 0.35s ease forwards;
        }
        .reason-icon-wrap {
          width:28px; height:28px; border-radius:50%; flex-shrink:0;
          background:rgba(45,106,79,0.1);
          display:flex; align-items:center; justify-content:center;
        }
        .reason-text { font-size:13px; color:#1A4731; line-height:1.65; font-style:italic; }

        .right-panel { width:220px; border-left:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; padding:16px; }
        .rp-label   { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:10px; }
        .rp-section { margin-bottom:20px; }
      `}</style>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-title">Supa<span>care</span></div>
        <span style={{ fontSize: 12, color: '#6B6860' }}>Today · AI-generated meal plans</span>
        {flaggedCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: '#FAEEDA', color: '#7A3E0D', border: '1px solid #f5d5b5' }}>
            {flaggedCount} dietary flags
          </span>
        )}
        <span style={{ fontSize: 10, fontWeight: 500, color: '#52B788', background: '#E1F5EE', border: '1px solid #b2ddb2', borderRadius: 20, padding: '3px 9px' }}>
          Click any meal for nutrition facts
        </span>
      </div>

      <div className="content-area">

        {/* LEFT: patient list */}
        <div className="patient-list">
          <div className="list-header">
            <span className="list-header-label">Patients ({mealPlans.length})</span>
          </div>
          {loading ? (
            <div style={{ padding: 16, fontSize: 13, color: '#A8A59F' }}>Generating plans…</div>
          ) : (
            mealPlans.map(plan => {
              const initials = plan.patient.name.split(' ').map(n => n[0]).join('').slice(0, 2);
              const hasFlags = plan.flags.length > 0;
              return (
                <div
                  key={plan.patient.id}
                  className={`patient-card ${selected?.patient.id === plan.patient.id ? 'active' : ''}`}
                  onClick={() => setSelected(plan)}
                >
                  <div className="pc-left" style={{ background: hasFlags ? '#EF9F27' : '#52B788' }} />
                  <div className="pc-top">
                    <div className="pc-avatar" style={{ background: hasFlags ? '#FAEEDA' : '#E1F5EE', color: hasFlags ? '#B5641B' : '#0F6E56' }}>
                      {initials}
                    </div>
                    <span className="pc-name">{plan.patient.name}</span>
                    {hasFlags && <AlertTriangle style={{ width: 12, height: 12, color: '#B5641B', flexShrink: 0 }} />}
                  </div>
                  <div className="pc-sub">
                    <span>Rm {plan.patient.room}</span>
                    {hasFlags && <span style={{ color: '#B5641B', fontWeight: 500 }}>{plan.flags.length} flag{plan.flags.length !== 1 ? 's' : ''}</span>}
                    {!hasFlags && <span style={{ color: '#0F6E56', fontWeight: 500 }}>✓ Clear</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CENTER: meal detail */}
        <div className="detail-pane">
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A8A59F', fontSize: 13 }}>
              Select a patient to view their meal plan
            </div>
          ) : (() => {
            const initials = selected.patient.name.split(' ').map(n => n[0]).join('').slice(0, 2);
            const hasFlags = selected.flags.length > 0;
            const meals = [
              { time: MEAL_TIMES[0], icon: MEAL_ICONS[0], name: selected.breakfast, mealType: 'Breakfast', desc: `Served with ${selected.side}`, cals: displayEnergy(selected.breakfastKcal, energyUnit), kcal: selected.breakfastKcal },
              { time: MEAL_TIMES[1], icon: MEAL_ICONS[1], name: selected.lunch, mealType: 'Lunch', desc: `Served with ${selected.side}`, cals: displayEnergy(selected.lunchKcal, energyUnit), kcal: selected.lunchKcal },
              { time: MEAL_TIMES[2], icon: MEAL_ICONS[2], name: selected.dinner, mealType: 'Dinner', desc: `Served with ${selected.side}`, cals: displayEnergy(selected.dinnerKcal, energyUnit), kcal: selected.dinnerKcal },
            ];

            return (
              <>
                {/* Patient header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: hasFlags ? '#FAEEDA' : '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500, color: hasFlags ? '#B5641B' : '#0F6E56', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, marginBottom: 2 }}>{selected.patient.name}</h2>
                    <p style={{ fontSize: 12, color: '#6B6860' }}>Room {selected.patient.room} · Today's plan · AI-generated</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20, background: hasFlags ? '#FAEEDA' : '#D8EED8', color: hasFlags ? '#7A3E0D' : '#1A4731', border: `1px solid ${hasFlags ? '#f5d5b5' : '#b2ddb2'}` }}>
                    {hasFlags ? `${selected.flags.length} flag${selected.flags.length !== 1 ? 's' : ''}` : 'Clear'}
                  </span>
                </div>

                {/* Meal grid — clickable */}
                <div>
                  <div className="section-title">Daily Meal Plan</div>
                  <div className="meal-grid">
                    {meals.map((meal, i) => (
                      <div
                        key={i}
                        className="meal-card"
                        style={{ animation: `fadeUp 0.35s ease ${i * 0.08}s forwards`, opacity: 0 }}
                        onClick={() => setNutritionPanel({ mealName: meal.name, mealType: meal.mealType, kcal: meal.kcal })}
                        title={`View nutritional facts for ${meal.name}`}
                      >
                        <div className="meal-time">{meal.time}</div>
                        <div className="meal-name">{meal.icon} {meal.name}</div>
                        <div className="meal-desc">{meal.desc}</div>
                        <div className="meal-cals">{meal.cals}</div>
                        <div className="meal-card-cta">
                          Nutrition facts <ChevronRight style={{ width: 9, height: 9 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Meal Plan Reason */}
                {selected.mealPlanReason && (
                  <div className="reason-box">
                    <div className="reason-icon-wrap">
                      <Sparkles style={{ width: 13, height: 13, color: '#2D6A4F' }} />
                    </div>
                    <p className="reason-text">{selected.mealPlanReason}</p>
                  </div>
                )}

                {/* Flagged foods */}
                {selected.flags.length > 0 && (
                  <div className="info-card" style={{ background: '#FAEEDA', borderColor: '#f5d5b5' }}>
                    <div className="info-card-label" style={{ color: '#7A3E0D' }}>Dietary Flags — Avoid</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {selected.flags.map((f, i) => (
                        <span key={i} className="flag-pill">
                          <AlertTriangle style={{ width: 10, height: 10 }} />
                          {f.item.name}: {f.reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI note */}
                <div className="info-card" style={{ background: '#D8EED8', borderColor: '#b2ddb2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Sparkles style={{ width: 13, height: 13, color: '#2D6A4F' }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#2D6A4F', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Note</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#1A4731', lineHeight: 1.6 }}>
                    Plan assigned from safe-food inventory. EHR contraindications applied. Side: <strong>{selected.side}</strong>.
                    {hasFlags && ` ${selected.flags.length} item(s) flagged and excluded from this plan.`}
                  </p>
                </div>
              </>
            );
          })()}
        </div>

        {/* RIGHT: summary */}
        <div className="right-panel">
          <div className="rp-section">
            <div className="rp-label">Plan Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#6B6860' }}>Total plans</span>
                <span style={{ fontWeight: 600 }}>{mealPlans.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#6B6860' }}>With flags</span>
                <span style={{ fontWeight: 600, color: '#B5641B' }}>{mealPlans.filter(m => m.flags.length > 0).length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#6B6860' }}>All clear</span>
                <span style={{ fontWeight: 600, color: '#0F6E56' }}>{mealPlans.filter(m => m.flags.length === 0).length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#6B6860' }}>Total flags</span>
                <span style={{ fontWeight: 600, color: '#A32D2D' }}>{flaggedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid #E5E0D6', paddingTop: 6, marginTop: 2 }}>
                <span style={{ color: '#6B6860' }}>Energy unit</span>
                <span style={{ fontWeight: 600, color: '#0F6E56' }}>{energyUnit}</span>
              </div>
            </div>
          </div>

          <div className="rp-section">
            <div className="rp-label">Flagged Patients</div>
            {mealPlans.filter(m => m.flags.length > 0).length === 0 ? (
              <div style={{ background: '#D8EED8', border: '1px solid #b2ddb2', borderRadius: 8, padding: '8px 10px', fontSize: 11, fontWeight: 500, color: '#1A4731' }}>
                ✓ No dietary conflicts
              </div>
            ) : (
              mealPlans.filter(m => m.flags.length > 0).map(plan => (
                <div key={plan.patient.id} onClick={() => setSelected(plan)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #E5E0D6', cursor: 'pointer' }}>
                  <AlertTriangle style={{ width: 12, height: 12, color: '#B5641B', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 500 }}>{plan.patient.name}</div>
                    <div style={{ fontSize: 10, color: '#6B6860' }}>{plan.flags.length} flag{plan.flags.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rp-section">
            <div className="rp-label">All Plans</div>
            {mealPlans.map(plan => (
              <div key={plan.patient.id} onClick={() => setSelected(plan)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 0', borderBottom: '1px solid #E5E0D6', cursor: 'pointer', background: selected?.patient.id === plan.patient.id ? 'rgba(82,183,136,0.07)' : 'transparent' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: plan.flags.length > 0 ? '#EF9F27' : '#52B788', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: selected?.patient.id === plan.patient.id ? 500 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {plan.patient.name}
                </span>
                <span style={{ fontSize: 10, color: '#A8A59F' }}>Rm {plan.patient.room}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nutrition Panel Modal */}
      {nutritionPanel && selected && (
        <NutritionPanel
          mealName={nutritionPanel.mealName}
          mealType={nutritionPanel.mealType}
          kcal={nutritionPanel.kcal}
          plan={selected}
          onClose={() => setNutritionPanel(null)}
        />
      )}
    </div>
  );
}