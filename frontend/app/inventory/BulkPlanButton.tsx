"use client"
import { useState, useEffect, useRef } from 'react';
import { X, Check, Loader, Sparkles, ShoppingCart, ExternalLink, RefreshCw, CheckCircle2, ChevronRight, PackagePlus } from 'lucide-react';
import { getFoodPlanSuggestions, getFoodPlanWeekPlan, createInventoryItemsBatch, SuggestedItem, WeekPlanDay } from '@/lib/api';

type Phase = 'idle' | 'preference' | 'generating' | 'reviewing' | 'planning' | 'done';

function inferUnit(item: SuggestedItem): string {
  const lower = item.name.toLowerCase();
  if (lower.includes('milk') || lower.includes('juice') || lower.includes('broth') || lower.includes('oil')) return 'ml';
  if (item.category === 'Dairy' && lower.includes('yogurt')) return 'g';
  if (lower.includes('egg')) return 'pcs';
  return 'g'; // default: weight
}

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Protein: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  Grain: { bg: '#F0FDF4', text: '#14532D', border: '#BBF7D0' },
  Vegetable: { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
  Dairy: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  Fruit: { bg: '#FDF4FF', text: '#6B21A8', border: '#E9D5FF' },
  Other: { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
};

export default function BulkPlanButton({ inventory, onInventoryAdded }: { inventory: any[]; onInventoryAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [preference, setPreference] = useState('');
  const [items, setItems] = useState<SuggestedItem[]>([]);
  const [approvedItems, setApprovedItems] = useState<SuggestedItem[]>([]);
  const [rejectedNames, setRejectedNames] = useState<string[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeekPlanDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [addingToInventory, setAddingToInventory] = useState(false);
  const [addedToInventory, setAddedToInventory] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const pending = items.filter(i => i.status === 'pending');
  const currentItem = pending[0] ?? null;
  const approvedCount = items.filter(i => i.status === 'approved').length;
  const totalSeen = items.filter(i => i.status !== 'pending').length;

  const startGeneration = async () => {
    setPhase('generating');
    setError(null);
    try {
      const data = await getFoodPlanSuggestions({
        rejectedNames,
        approvedNames: approvedItems.map(i => i.name),
        inventoryNames: inventory.map((i: any) => i.name),
        preference,
      });
      const newItems: SuggestedItem[] = data.items.map((item, idx) => ({
        ...item,
        id: `sug-${Date.now()}-${idx}`,
        status: 'pending',
      }));
      setItems(prev => [...prev, ...newItems]);
      setPhase('reviewing');
    } catch (e) {
      setError('Could not reach server. Make sure the backend is running.');
      setPhase('idle');
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (phase === 'idle') setPhase('preference');
  };

  const handleClose = () => setOpen(false);

  const handleReset = () => {
    setItems([]);
    setApprovedItems([]);
    setRejectedNames([]);
    setWeekPlan([]);
    setPreference('');
    setPhase('preference');
    setError(null);
    setAddingToInventory(false);
    setAddedToInventory(false);
  };

  const handleAddToInventory = async () => {
    setAddingToInventory(true);
    setError(null);
    try {
      const approved = items.filter(i => i.status === 'approved');
      await createInventoryItemsBatch(
        approved.map(item => ({
          name: item.name,
          unit: inferUnit(item),
          stock: 0,
          tags: item.tags,
        }))
      );
      setAddedToInventory(true);
      onInventoryAdded?.();
    } catch (e) {
      setError('Failed to add items to inventory. Please try again.');
    } finally {
      setAddingToInventory(false);
    }
  };

  const animateAndAdvance = (dir: 'left' | 'right', item: SuggestedItem) => {
    setSwipeDir(dir);
    setTimeout(() => {
      setSwipeDir(null);
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: dir === 'right' ? 'approved' : 'rejected' } : i
      ));
      if (dir === 'right') {
        setApprovedItems(prev => [...prev, { ...item, status: 'approved' }]);
      } else {
        setRejectedNames(prev => [...prev, item.name]);
      }
    }, 320);
  };

  useEffect(() => {
    if (phase !== 'reviewing') return;
    const stillPending = items.filter(i => i.status === 'pending');
    if (stillPending.length === 0 && items.length > 0) {
      const approved = items.filter(i => i.status === 'approved').length;
      if (approved >= 5) {
        generateWeekPlan();
      } else {
        startGeneration();
      }
    }
  }, [items, phase]);

  const generateWeekPlan = async () => {
    setPhase('planning');
    setError(null);
    try {
      const approved = items.filter(i => i.status === 'approved');
      const data = await getFoodPlanWeekPlan({
        approvedItems: approved.map(i => ({ name: i.name, weeklyQty: i.weeklyQty })),
      });
      setWeekPlan(data.days);
      setPhase('done');
    } catch (e) {
      setError('Could not generate week plan. Please try again.');
      setPhase('reviewing');
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 40,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 20px',
          background: '#1C2B22', color: '#52B788',
          border: '1.5px solid rgba(82,183,136,0.3)', borderRadius: 14,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 24px rgba(28,43,34,0.35), 0 0 0 1px rgba(82,183,136,0.1)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(28,43,34,0.45), 0 0 0 1px rgba(82,183,136,0.2)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(28,43,34,0.35), 0 0 0 1px rgba(82,183,136,0.1)';
        }}
      >
        <Sparkles style={{ width: 15, height: 15 }} />
        AI Bulk Food Plan
        {approvedCount > 0 && phase !== 'done' && (
          <span style={{ background: 'rgba(82,183,136,0.2)', color: '#52B788', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 2 }}>
            {approvedCount} ✓
          </span>
        )}
        {phase === 'done' && (
          <span style={{ background: 'rgba(82,183,136,0.2)', color: '#52B788', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 2 }}>
            Done ✓
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(15,20,17,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, animation: 'overlayIn 0.2s ease',
          }}
        >
          <style>{`
            @keyframes overlayIn   { from{opacity:0} to{opacity:1} }
            @keyframes panelIn     { from{opacity:0;transform:scale(0.95) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
            @keyframes cardIn      { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
            @keyframes swipeLeft   { to{opacity:0;transform:translateX(-120%) rotate(-18deg)} }
            @keyframes swipeRight  { to{opacity:0;transform:translateX(120%) rotate(18deg)} }
            @keyframes shimmer     { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            @keyframes spin        { to{transform:rotate(360deg)} }
            @keyframes fadeUp      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
            @keyframes checkPop    { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }

            .modal-panel {
              background:#F9F6F1; border:1px solid #E5E0D6; border-radius:18px;
              width:100%; max-width:560px; max-height:92vh; overflow:hidden;
              display:flex; flex-direction:column;
              animation:panelIn 0.25s cubic-bezier(0.34,1.2,0.64,1);
              box-shadow:0 24px 80px rgba(15,20,17,0.3);
            }
            .modal-header {
              display:flex; align-items:center; gap:10px;
              padding:18px 20px 14px; border-bottom:1px solid #E5E0D6;
              background:#fff; flex-shrink:0;
            }
            .modal-body { flex:1; overflow-y:auto; padding:20px; }

            .review-card {
              background:#fff; border:1px solid #E5E0D6; border-radius:14px;
              padding:20px; animation:cardIn 0.3s ease forwards; position:relative;
            }
            .review-card.swipe-left  { animation:swipeLeft  0.32s ease forwards; }
            .review-card.swipe-right { animation:swipeRight 0.32s ease forwards; }

            .action-btn {
              display:flex; align-items:center; justify-content:center;
              width:56px; height:56px; border-radius:50%; border:2px solid;
              cursor:pointer; transition:all 0.15s; font-family:inherit; flex-shrink:0;
            }
            .action-btn:hover { transform:scale(1.1); }
            .action-btn.reject  { background:#FCEBEB; border-color:#F5C4C4; color:#A32D2D; }
            .action-btn.reject:hover  { background:#F5C4C4; }
            .action-btn.approve { background:#D8EED8; border-color:#b2ddb2; color:#1A4731; }
            .action-btn.approve:hover { background:#b2ddb2; }

            .prog-bar  { height:3px; background:#E5E0D6; border-radius:3px; overflow:hidden; }
            .prog-fill { height:3px; border-radius:3px; background:#52B788; transition:width 0.4s ease; }

            .approved-chip {
              display:inline-flex; align-items:center; gap:5px;
              font-size:11px; padding:3px 9px; border-radius:20px;
              background:#D8EED8; color:#1A4731; border:1px solid #b2ddb2; font-weight:500;
            }

            .day-card {
              background:#fff; border:1px solid #E5E0D6; border-radius:10px;
              margin-bottom:8px; overflow:hidden;
              animation:fadeUp 0.3s ease forwards; opacity:0;
            }
            .day-header { padding:8px 14px; background:#1C2B22; color:#52B788; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; }
            .meal-row   { display:flex; gap:10px; padding:8px 14px; border-bottom:1px solid #F0EDE8; font-size:12px; }
            .meal-row:last-child { border-bottom:none; }
            .meal-time  { font-size:10px; font-weight:600; color:#A8A59F; letter-spacing:0.07em; text-transform:uppercase; width:68px; flex-shrink:0; padding-top:1px; }

            .skel {
              border-radius:6px; height:14px;
              background:linear-gradient(90deg,#e7e5e4 25%,#d6d3d1 50%,#e7e5e4 75%);
              background-size:200% 100%; animation:shimmer 1.4s infinite;
            }
            .dist-link {
              display:inline-flex; align-items:center; gap:4px;
              font-size:11px; color:#0F6E56; font-weight:500;
              text-decoration:none; border-bottom:1px solid rgba(15,110,86,0.25); transition:border-color 0.15s;
            }
            .dist-link:hover { border-color:#0F6E56; }
          `}</style>

          <div className="modal-panel">

            {/* Header */}
            <div className="modal-header">
              <Sparkles style={{ width: 16, height: 16, color: '#52B788', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 500, color: '#1A1A18' }}>
                  AI Bulk Food Plan
                </div>
                <div style={{ fontSize: 11, color: '#6B6860', marginTop: 1 }}>
                  {phase === 'idle' && 'Ready to generate recommendations'}
                  {phase === 'preference' && 'Tell us what you need'}
                  {phase === 'generating' && 'Finding best-value ingredients…'}
                  {phase === 'reviewing' && `${approvedCount} approved · ${items.filter(i => i.status === 'rejected').length} replaced`}
                  {phase === 'planning' && 'Building your 7-day plan…'}
                  {phase === 'done' && `Week plan ready · ${approvedCount} ingredients`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(phase === 'reviewing' || phase === 'done') && (
                  <button
                    onClick={handleReset}
                    style={{ background: 'none', border: '1px solid #E5E0D6', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#6B6860', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}
                  >
                    <RefreshCw style={{ width: 11, height: 11 }} /> Reset
                  </button>
                )}
                <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6860', padding: 4 }}>
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body">

              {phase === 'preference' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: '#fff', border: '1px solid #E5E0D6', borderRadius: 12, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                      <Sparkles style={{ width: 13, height: 13, color: '#52B788' }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#1A4731', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                        Dietary Preference
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#6B6860', lineHeight: 1.6, marginBottom: 14 }}>
                      Describe what you'd like to stock. The AI will suggest items that match your needs.
                    </p>
                    <textarea
                      value={preference}
                      onChange={e => setPreference(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startGeneration(); } }}
                      placeholder="e.g. I want more carbs, high-protein options for recovery patients, or more vegetarian variety…"
                      rows={3}
                      autoFocus
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: '1.5px solid #E5E0D6', borderRadius: 8,
                        fontSize: 13, fontFamily: 'inherit', color: '#1A1A18',
                        background: '#F9F6F1', resize: 'none', outline: 'none',
                        lineHeight: 1.6, boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#52B788')}
                      onBlur={e => (e.target.style.borderColor = '#E5E0D6')}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {['More carbs', 'High protein', 'Vegetarian', 'Dairy-free', 'Low sodium', 'Comfort foods'].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setPreference(p => p ? `${p}, ${chip.toLowerCase()}` : chip.toLowerCase())}
                          style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 20,
                            border: '1px solid #E5E0D6', background: '#F9F6F1',
                            color: '#6B6860', cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#52B788'; (e.currentTarget as HTMLElement).style.color = '#0F6E56'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E0D6'; (e.currentTarget as HTMLElement).style.color = '#6B6860'; }}
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={startGeneration}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px 0', background: '#1C2B22', color: '#52B788',
                        border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em',
                      }}
                    >
                      <Sparkles style={{ width: 14, height: 14 }} />
                      {preference.trim() ? 'Generate with preferences' : 'Generate suggestions'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── GENERATING ── */}
              {phase === 'generating' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff', borderRadius: 12, border: '1px solid #E5E0D6' }}>
                    <Loader style={{ width: 16, height: 16, color: '#52B788', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#1A1A18' }}>Analysing market prices & patient needs…</span>
                  </div>
                  {[80, 60, 70, 50, 65].map((w, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E0D6', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="skel" style={{ width: `${w}%`, height: 16 }} />
                      <div className="skel" style={{ width: '40%', height: 10 }} />
                      <div className="skel" style={{ width: '90%', height: 10 }} />
                      <div className="skel" style={{ width: '55%', height: 10 }} />
                    </div>
                  ))}
                </div>
              )}

              {/* ── REVIEWING ── */}
              {phase === 'reviewing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {preference.trim() && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', background: '#E1F5EE', border: '1px solid #b2ddb2', borderRadius: 8 }}>
                      <Sparkles style={{ width: 11, height: 11, color: '#0F6E56' }} />
                      <span style={{ fontSize: 11, color: '#0F6E56', fontWeight: 500, flex: 1 }}>
                        Preference: <em>"{preference}"</em>
                      </span>
                      <button
                        onClick={() => { setPreference(''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52B788', padding: 0, fontSize: 14, lineHeight: 1 }}
                        title="Clear preference"
                      >×</button>
                    </div>
                  )}

                  {totalSeen > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#A8A59F', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
                        <span>{approvedCount} approved</span>
                        <span>Need 5 to generate plan</span>
                      </div>
                      <div className="prog-bar">
                        <div className="prog-fill" style={{ width: `${Math.min(100, (approvedCount / 5) * 100)}%` }} />
                      </div>
                    </div>
                  )}

                  {currentItem ? (
                    <>
                      <div
                        ref={cardRef}
                        className={`review-card ${swipeDir === 'left' ? 'swipe-left' : swipeDir === 'right' ? 'swipe-right' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            ...(CAT_COLORS[currentItem.category] ?? CAT_COLORS.Other),
                          }}>
                            {currentItem.category}
                          </span>
                          <span style={{ fontSize: 10, color: '#A8A59F', fontWeight: 500 }}>
                            {pending.length} remaining
                          </span>
                        </div>

                        <div style={{ marginBottom: 10 }}>
                          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1A1A18', marginBottom: 4 }}>
                            {currentItem.name}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#1A4731', fontFamily: "'Fraunces', serif" }}>
                              {currentItem.estimatedPrice}
                            </span>
                            <span style={{ fontSize: 11, color: '#6B6860' }}>·</span>
                            <span style={{ fontSize: 12, color: '#6B6860' }}>{currentItem.weeklyQty} / week</span>
                          </div>
                        </div>

                        <p style={{ fontSize: 13, color: '#6B6860', lineHeight: 1.6, marginBottom: 14, padding: '10px 12px', background: '#F9F6F1', borderRadius: 8 }}>
                          {currentItem.reason}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, marginBottom: 12 }}>
                          <ShoppingCart style={{ width: 13, height: 13, color: '#15803d', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#14532D', flex: 1 }}>
                            Best price via <strong>{currentItem.distributorName}</strong>
                          </span>
                          <a href={currentItem.distributorUrl} target="_blank" rel="noopener noreferrer" className="dist-link" onClick={e => e.stopPropagation()}>
                            View <ExternalLink style={{ width: 10, height: 10 }} />
                          </a>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {currentItem.tags.map(t => (
                            <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#F9F6F1', color: '#6B6860', border: '1px solid #E5E0D6', fontWeight: 500 }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Approve / Reject */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                        <div style={{ textAlign: 'center' }}>
                          <button className="action-btn reject" onClick={() => animateAndAdvance('left', currentItem)} disabled={!!swipeDir}>
                            <X style={{ width: 22, height: 22 }} />
                          </button>
                          <div style={{ fontSize: 10, color: '#A8A59F', fontWeight: 500, marginTop: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Replace</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 20 }}>🍽️</span>
                          <span style={{ fontSize: 9, color: '#A8A59F', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Decide</span>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <button className="action-btn approve" onClick={() => animateAndAdvance('right', currentItem)} disabled={!!swipeDir}>
                            <Check style={{ width: 22, height: 22 }} />
                          </button>
                          <div style={{ fontSize: 10, color: '#A8A59F', fontWeight: 500, marginTop: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Approve</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
                      <Loader style={{ width: 20, height: 20, color: '#52B788', animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 13, color: '#6B6860' }}>Finding replacement ingredients…</span>
                    </div>
                  )}

                  {approvedCount > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#A8A59F', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8 }}>
                        Approved ({approvedCount})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {items.filter(i => i.status === 'approved').map(i => (
                          <span key={i.id} className="approved-chip">
                            <Check style={{ width: 9, height: 9 }} /> {i.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {approvedCount >= 5 && currentItem && (
                    <button
                      onClick={generateWeekPlan}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        width: '100%', padding: '11px 0',
                        background: '#1C2B22', color: '#52B788', border: 'none',
                        borderRadius: 10, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em',
                      }}
                    >
                      <Sparkles style={{ width: 14, height: 14 }} />
                      Generate Week Plan Now ({approvedCount} ingredients)
                    </button>
                  )}
                </div>
              )}

              {/* ── PLANNING ── */}
              {phase === 'planning' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff', borderRadius: 12, border: '1px solid #E5E0D6' }}>
                    <Loader style={{ width: 16, height: 16, color: '#52B788', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#1A1A18' }}>Building 7-day meal plan from {approvedCount} approved ingredients…</span>
                  </div>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E0D6', overflow: 'hidden' }}>
                      <div style={{ height: 32, background: '#E5E0D6', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,#e7e5e4 25%,#d6d3d1 50%,#e7e5e4 75%)' }} />
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[100, 70, 85].map((w, j) => <div key={j} className="skel" style={{ width: `${w}%` }} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── DONE ── */}
              {phase === 'done' && weekPlan.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  <div style={{ background: 'linear-gradient(135deg,#D8EED8,#E1F5EE)', border: '1px solid #b2ddb2', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(21,128,61,0.12)', border: '1.5px solid rgba(21,128,61,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 style={{ width: 18, height: 18, color: '#15803d', animation: 'checkPop 0.4s ease' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#14532D' }}>7-Day Bulk Food Plan Ready</div>
                      <div style={{ fontSize: 11, color: '#1A4731', marginTop: 2 }}>{approvedCount} approved ingredients · Cost-optimised</div>
                    </div>
                  </div>

                  {/* Bulk order list */}
                  <div style={{ background: '#fff', border: '1px solid #E5E0D6', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#A8A59F', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8 }}>Bulk Order List</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {items.filter(i => i.status === 'approved').map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Check style={{ width: 11, height: 11, color: '#0F6E56', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{item.name}</span>
                          <span style={{ fontSize: 11, color: '#6B6860' }}>{item.weeklyQty}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#1A4731' }}>{item.estimatedPrice}</span>
                          <a href={item.distributorUrl} target="_blank" rel="noopener noreferrer" className="dist-link" style={{ fontSize: 10 }}>
                            {item.distributorName} <ExternalLink style={{ width: 9, height: 9 }} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Day cards */}
                  {weekPlan.map((day, i) => (
                    <div key={day.day} className="day-card" style={{ animationDelay: `${i * 0.06}s` }}>
                      <div className="day-header">{day.day}</div>
                      {day.meals.map((meal, j) => (
                        <div key={j} className="meal-row">
                          <span className="meal-time">{meal.time}</span>
                          <span style={{ fontSize: 12, color: '#1A1A18', lineHeight: 1.5 }}>{meal.description}</span>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Add to Inventory CTA */}
                  {addedToInventory ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#D8EED8', border: '1px solid #b2ddb2', borderRadius: 10 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#15803d', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#14532D' }}>Added to inventory!</div>
                        <div style={{ fontSize: 11, color: '#1A4731', marginTop: 1 }}>
                          {items.filter(i => i.status === 'approved').length} items added with stock set to 0 — update quantities in Manage.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToInventory}
                      disabled={addingToInventory}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '13px 0',
                        background: addingToInventory ? 'rgba(28,43,34,0.6)' : '#1C2B22',
                        color: '#52B788', border: '1.5px solid rgba(82,183,136,0.3)',
                        borderRadius: 10, fontSize: 13, fontWeight: 600,
                        cursor: addingToInventory ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', letterSpacing: '0.01em',
                        transition: 'background 0.15s',
                      }}
                    >
                      {addingToInventory
                        ? <><Loader style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Adding to inventory…</>
                        : <><PackagePlus style={{ width: 14, height: 14 }} /> Add {items.filter(i => i.status === 'approved').length} items to inventory</>
                      }
                    </button>
                  )}

                  {/* Secondary actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleReset}
                      style={{ flex: 1, padding: '9px 0', background: 'transparent', border: '1px solid #E5E0D6', borderRadius: 9, fontSize: 12, fontWeight: 500, color: '#6B6860', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Start Over
                    </button>
                    <button
                      onClick={() => {
                        const text = weekPlan.map(d =>
                          `${d.day}\n${d.meals.map(m => `  ${m.time}: ${m.description}`).join('\n')}`
                        ).join('\n\n');
                        navigator.clipboard.writeText(text);
                      }}
                      style={{ flex: 1, padding: '9px 0', background: 'transparent', border: '1px solid #E5E0D6', borderRadius: 9, fontSize: 12, fontWeight: 500, color: '#6B6860', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                    >
                      <ChevronRight style={{ width: 12, height: 12 }} /> Copy Plan
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ padding: '10px 14px', background: '#FCEBEB', border: '1px solid #F5C4C4', borderRadius: 10, fontSize: 12, color: '#A32D2D', marginTop: 8 }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}