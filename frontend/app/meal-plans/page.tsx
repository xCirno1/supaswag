"use client"
import { useState, useEffect } from 'react';
import { getMealPlans, MealPlan } from '@/lib/api';
import { useSettings } from '@/lib/settings-context';
import { displayEnergy } from '@/lib/units';
import { Sparkles, AlertTriangle } from 'lucide-react';

const MEAL_ICONS = ['🌅', '☀️', '🌙'];
const MEAL_TIMES = ['Breakfast · 7:30', 'Lunch · 12:00', 'Dinner · 17:30'];

const MEAL_KCAL = [320, 410, 480] as const;

function generateMealSlots(
  protein: string,
  side: string,
  energyUnit: 'kcal' | 'kJ',
) {
  return [
    {
      time: MEAL_TIMES[0], icon: MEAL_ICONS[0],
      name: 'Morning Nutrition', desc: `Balanced start with ${side}`,
      cals: displayEnergy(MEAL_KCAL[0], energyUnit),
    },
    {
      time: MEAL_TIMES[1], icon: MEAL_ICONS[1],
      name: protein, desc: `Served with ${side}`,
      cals: displayEnergy(MEAL_KCAL[1], energyUnit),
    },
    {
      time: MEAL_TIMES[2], icon: MEAL_ICONS[2],
      name: `${protein} (dinner)`, desc: `Light evening meal with ${side}`,
      cals: displayEnergy(MEAL_KCAL[2], energyUnit),
    },
  ];
}

export default function MealPlansPage() {
  const { energyUnit } = useSettings();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selected, setSelected] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes chipPop { 0%{opacity:0;transform:scale(0.85)} 70%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }

        .topbar { display:flex; align-items:center; gap:12px; padding:14px 24px; border-bottom:1px solid #E5E0D6; background:#fff; flex-shrink:0; }
        .topbar-title { font-family:'Fraunces',serif; font-size:18px; font-weight:500; color:#1A1A18; flex:1; }
        .topbar-title span { color:#52B788; }
        .content-area { display:flex; flex:1; overflow:hidden; }

        .patient-list { width:260px; border-right:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; }
        .list-header { padding:14px 16px 8px; display:flex; align-items:center; justify-content:space-between; }
        .list-header-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; }

        .patient-card { padding:10px 16px; border-bottom:1px solid #E5E0D6; cursor:pointer; transition:background 0.1s; position:relative; }
        .patient-card:hover { background:#F9F6F1; }
        .patient-card.active { background:#E1F5EE; }
        .pc-left { position:absolute; left:0; top:8px; bottom:8px; width:3px; border-radius:0 2px 2px 0; }
        .pc-top { display:flex; align-items:center; gap:8px; margin-bottom:3px; }
        .pc-avatar { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:500; flex-shrink:0; }
        .pc-name { font-size:13px; font-weight:500; color:#1A1A18; flex:1; }
        .pc-sub { font-size:11px; color:#6B6860; display:flex; align-items:center; gap:5px; }

        .detail-pane { flex:1; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:16px; }
        .info-card { background:#fff; border:1px solid #E5E0D6; border-radius:12px; padding:16px; }
        .info-card-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:12px; }
        .section-title { font-family:'Fraunces',serif; font-size:16px; font-weight:500; color:#1A1A18; margin-bottom:12px; }

        .meal-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .meal-card { background:#F9F6F1; border-radius:10px; padding:12px; border:1px solid #E5E0D6; }
        .meal-time { font-size:10px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:4px; }
        .meal-name { font-size:13px; font-weight:500; margin-bottom:4px; }
        .meal-desc { font-size:11px; color:#6B6860; line-height:1.5; }
        .meal-cals { font-size:11px; color:#0F6E56; font-weight:500; margin-top:6px; }

        .flag-pill { display:inline-flex; align-items:center; gap:5px; font-size:11px; color:#B5641B; background:#FAEEDA; border:1px solid #f5d5b5; border-radius:20px; padding:3px 9px; margin:3px; }

        .right-panel { width:220px; border-left:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; padding:16px; }
        .rp-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:10px; }
        .rp-section { margin-bottom:20px; }
      `}</style>

      <div className="topbar">
        <div className="topbar-title">Supa<span>care</span></div>
        <span style={{ fontSize: 12, color: '#6B6860' }}>Today · AI-generated meal plans</span>
        {flaggedCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: '#FAEEDA', color: '#7A3E0D', border: '1px solid #f5d5b5' }}>
            {flaggedCount} dietary flags
          </span>
        )}
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 8, background: '#1C2B22', color: '#52B788', border: 'none', cursor: 'pointer' }}>
          <Sparkles style={{ width: 12, height: 12 }} />
          Regenerate All
        </button>
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
              { time: MEAL_TIMES[0], icon: MEAL_ICONS[0], name: selected.breakfast, desc: `Served with ${selected.side}`, cals: displayEnergy(selected.breakfastKcal, energyUnit) },
              { time: MEAL_TIMES[1], icon: MEAL_ICONS[1], name: selected.lunch, desc: `Served with ${selected.side}`, cals: displayEnergy(selected.lunchKcal, energyUnit) },
              { time: MEAL_TIMES[2], icon: MEAL_ICONS[2], name: selected.dinner, desc: `Served with ${selected.side}`, cals: displayEnergy(selected.dinnerKcal, energyUnit) },
            ];

            return (
              <>
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

                {/* Meal grid — energy values now use the user's preferred unit */}
                <div>
                  <div className="section-title">Daily Meal Plan</div>
                  <div className="meal-grid">
                    {meals.map((meal, i) => (
                      <div key={i} className="meal-card" style={{ animation: `fadeUp 0.35s ease ${i * 0.08}s forwards`, opacity: 0 }}>
                        <div className="meal-time">{meal.time}</div>
                        <div className="meal-name">{meal.icon} {meal.name}</div>
                        <div className="meal-desc">{meal.desc}</div>
                        <div className="meal-cals">{meal.cals}</div>
                      </div>
                    ))}
                  </div>
                </div>

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
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#2D6A4F', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Note</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#1A4731', lineHeight: 1.6 }}>
                    Plan assigned from safe-food inventory. EHR contraindications applied. Side: <strong>{selected.side}</strong>.
                    {hasFlags && ` ${selected.flags.length} item(s) flagged and excluded from this plan.`}                  </p>
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
                <div
                  key={plan.patient.id}
                  onClick={() => setSelected(plan)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #E5E0D6', cursor: 'pointer' }}
                >
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
              <div
                key={plan.patient.id}
                onClick={() => setSelected(plan)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 0', borderBottom: '1px solid #E5E0D6', cursor: 'pointer', background: selected?.patient.id === plan.patient.id ? 'rgba(82,183,136,0.07)' : 'transparent' }}
              >
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
    </div>
  );
}