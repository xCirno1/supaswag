"use client"
import { useState, useEffect } from 'react';
import { getInventoryNeeds, updateInventoryStock, InventoryNeed } from '@/lib/api';
import { useSettings } from '@/lib/settings-context';
import { displayStock } from '@/lib/units';
import { Check, X } from 'lucide-react';
import BulkPlanButton from './BulkPlanButton';

export default function InventoryPage() {
  const { weightUnit } = useSettings();
  const [inventoryData, setInventoryData] = useState<InventoryNeed[]>([]);
  const [selected, setSelected] = useState<InventoryNeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadInventory = () =>
    getInventoryNeeds()
      .then(data => {
        setInventoryData(data);
        if (data.length > 0)
          setSelected(prev => prev ? (data.find(d => d.id === prev.id) ?? data[0]) : data[0]);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

  useEffect(() => { loadInventory(); }, []);

  const itemsToOrder = inventoryData.filter(i => i.status === 'ORDER NOW');

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    try {
      await Promise.all(itemsToOrder.map(item => {
        const orderQty = Math.max(0, Math.round(item.requested * 7) - item.stock);
        return updateInventoryStock(item.id, item.stock + orderQty);
      }));
      const updated = await getInventoryNeeds();
      setInventoryData(updated);
      setOrderConfirmed(true);
      setTimeout(() => { setShowDialog(false); setOrderConfirmed(false); }, 2200);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

        .topbar { display:flex; align-items:center; gap:12px; padding:14px 24px; border-bottom:1px solid #E5E0D6; background:#fff; flex-shrink:0; }
        .topbar-title { font-family:'Fraunces',serif; font-size:18px; font-weight:500; color:#1A1A18; flex:1; }
        .topbar-title span { color:#52B788; }
        .content-area { display:flex; flex:1; overflow:hidden; }

        .inv-list { width:260px; border-right:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; }
        .list-header { padding:14px 16px 8px; display:flex; align-items:center; justify-content:space-between; }
        .list-header-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; }

        .inv-card { padding:10px 16px; border-bottom:1px solid #E5E0D6; cursor:pointer; transition:background 0.1s; position:relative; }
        .inv-card:hover { background:#F9F6F1; }
        .inv-card.active { background:#E1F5EE; }
        .inv-card-left { position:absolute; left:0; top:8px; bottom:8px; width:3px; border-radius:0 2px 2px 0; }
        .inv-card-name { font-size:13px; font-weight:500; color:#1A1A18; margin-bottom:3px; }
        .inv-card-row { display:flex; align-items:center; gap:8px; }
        .stock-bar-wrap { flex:1; height:4px; background:#E5E0D6; border-radius:4px; overflow:hidden; }
        .stock-bar { height:4px; border-radius:4px; }

        .detail-pane { flex:1; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:16px; }
        .info-card { background:#fff; border:1px solid #E5E0D6; border-radius:12px; padding:16px; }
        .info-card-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:10px; }

        .stat-row-h { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .stat-box { background:#fff; border:1px solid #E5E0D6; border-radius:12px; padding:14px 16px; }
        .stat-box-label { font-size:10px; font-weight:500; color:#A8A59F; letter-spacing:0.07em; text-transform:uppercase; margin-bottom:4px; }
        .stat-box-value { font-family:'Fraunces',serif; font-size:1.8rem; line-height:1; color:#1A1A18; }
        .stat-box-sub { font-size:11px; color:#6B6860; margin-top:3px; }

        .right-panel { width:220px; border-left:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; padding:16px; }
        .rp-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:10px; }
        .rp-section { margin-bottom:20px; }

        .tag-pill { font-size:10px; padding:2px 7px; border-radius:20px; background:#F9F6F1; color:#6B6860; border:1px solid #E5E0D6; font-weight:500; }

        .order-btn { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:500; padding:8px 16px; border-radius:8px; background:#1C2B22; color:#52B788; border:none; cursor:pointer; transition:background 0.15s; }
        .order-btn:hover { background:#2D6A4F; }

        .dialog-overlay { position:fixed; inset:0; background:rgba(28,25,23,0.45); backdrop-filter:blur(4px); z-index:50; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .dialog-panel { background:#F9F6F1; border:1px solid #E5E0D6; border-radius:14px; width:100%; max-width:520px; max-height:85vh; overflow-y:auto; margin:1rem; animation:scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.93) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>

      <div className="topbar">
        <div className="topbar-title">Supa<span>care</span></div>
        <span style={{ fontSize: 12, color: '#6B6860' }}>AI-Assisted Inventory Forecasting</span>
        {itemsToOrder.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F5C4C4' }}>
            {itemsToOrder.length} items need restocking
          </span>
        )}
        <button className="order-btn" onClick={() => setShowDialog(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
          Generate PO
        </button>
      </div>

      <div className="content-area">

        {/* LEFT: inventory list */}
        <div className="inv-list">
          <div className="list-header">
            <span className="list-header-label">All Items ({inventoryData.length})</span>
          </div>
          {loading ? (
            <div style={{ padding: 16, fontSize: 13, color: '#A8A59F' }}>Loading…</div>
          ) : (
            inventoryData.map(item => {
              const isOrder = item.status === 'ORDER NOW';
              const demand = item.requested * 7;
              const pct = demand > 0 ? Math.min(100, Math.round((item.stock / demand) * 100)) : 100;
              const barColor = pct > 60 ? '#52B788' : pct > 25 ? '#EF9F27' : '#E24B4A';
              return (
                <div
                  key={item.id}
                  className={`inv-card ${selected?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelected(item)}
                >
                  <div className="inv-card-left" style={{ background: isOrder ? '#E24B4A' : '#52B788' }} />
                  <div className="inv-card-name">{item.name}</div>
                  <div className="inv-card-row">
                    <span style={{ fontSize: 11, color: '#6B6860' }}>
                      {displayStock(item.stock, item.unit, weightUnit)}
                    </span>
                    <div className="stock-bar-wrap">
                      <div className="stock-bar" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 500, color: isOrder ? '#A32D2D' : '#0F6E56', flexShrink: 0 }}>
                      {isOrder ? 'ORDER' : 'OK'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CENTER: detail */}
        <div className="detail-pane">
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A8A59F', fontSize: 13 }}>
              Select an item to view details
            </div>
          ) : (() => {
            const isOrder = selected.status === 'ORDER NOW';
            const demand = Math.round(selected.requested * 7);
            const orderQty = parseFloat(Math.max(0, demand - selected.stock).toFixed(2));
            const pct = demand > 0 ? Math.min(100, Math.round((selected.stock / demand) * 100)) : 100;
            const barColor = pct > 60 ? '#52B788' : pct > 25 ? '#EF9F27' : '#E24B4A';

            // Human-readable display values
            const stockDisplay = displayStock(selected.stock, selected.unit, weightUnit);
            const demandDisplay = displayStock(demand, selected.unit, weightUnit);
            const orderDisplay = displayStock(orderQty, selected.unit, weightUnit);

            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#6B6860', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                      Inventory Item · {selected.id}
                    </div>
                    <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1A1A18' }}>{selected.name}</h2>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20, background: isOrder ? '#FCEBEB' : '#D8EED8', color: isOrder ? '#A32D2D' : '#1A4731', border: `1px solid ${isOrder ? '#F5C4C4' : '#b2ddb2'}` }}>
                    {selected.status}
                  </span>
                </div>

                <div className="stat-row-h">
                  <div className="stat-box">
                    <div className="stat-box-label">Current Stock</div>
                    <div className="stat-box-value" style={{ fontSize: '1.3rem' }}>{stockDisplay}</div>
                    <div className="stat-box-sub">stored as {selected.stock} {selected.unit}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-label">7-Day Demand</div>
                    <div className="stat-box-value" style={{ color: isOrder ? '#B5641B' : '#1A1A18', fontSize: '1.3rem' }}>{demandDisplay}</div>
                    <div className="stat-box-sub">needed this week</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-label">Order Qty</div>
                    <div className="stat-box-value" style={{ color: orderQty > 0 ? '#A32D2D' : '#0F6E56', fontSize: '1.3rem' }}>{orderDisplay}</div>
                    <div className="stat-box-sub">to order</div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-card-label">Stock vs Demand</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 8, background: '#E5E0D6', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: 8, borderRadius: 8, background: barColor, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: barColor }}>{pct}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#6B6860' }}>
                    <span>0</span>
                    <span>{demandDisplay} (7-day need)</span>
                  </div>
                </div>

                <div className="info-card" style={{ background: isOrder ? '#FAEEDA' : '#F9F6F1', borderColor: isOrder ? '#F5C4B3' : '#E5E0D6' }}>
                  <div className="info-card-label">AI Insight</div>
                  <p style={{ fontSize: 13, color: isOrder ? '#7A3E0D' : '#6B6860', lineHeight: 1.6, fontWeight: isOrder ? 500 : 400 }}>
                    {selected.aiInsight}
                  </p>
                  {selected.blockedCount > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#B5641B', background: '#fff', border: '1px solid #F5C4B3', borderRadius: 8, padding: '6px 10px' }}>
                      ⚠ {selected.blockedCount} patient(s) cannot eat this item
                    </div>
                  )}
                </div>

                {selected.tags.length > 0 && (
                  <div className="info-card">
                    <div className="info-card-label">Dietary Tags</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selected.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* RIGHT: order summary */}
        <div className="right-panel">
          <div className="rp-section">
            <div className="rp-label">Order Summary</div>
            {itemsToOrder.length === 0 ? (
              <div style={{ background: '#D8EED8', border: '1px solid #b2ddb2', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#1A4731' }}>✓ All stock sufficient</div>
              </div>
            ) : (
              itemsToOrder.map(item => {
                const orderQty = Math.max(0, Math.round(item.requested * 7) - item.stock);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid #E5E0D6', cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#A32D2D' }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: '#6B6860', marginTop: 1 }}>
                        Order {displayStock(orderQty, item.unit, weightUnit)}
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Fraunces',serif", fontSize: '1.2rem', color: '#A32D2D' }}>{orderQty.toFixed(2)}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="rp-section">
            <div className="rp-label">All Items</div>
            {inventoryData.map(item => {
              const demand = item.requested * 7;
              const pct = demand > 0 ? Math.min(100, Math.round((item.stock / demand) * 100)) : 100;
              const color = pct > 60 ? '#52B788' : pct > 25 ? '#EF9F27' : '#E24B4A';
              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #E5E0D6', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selected?.id === item.id ? 500 : 400 }}>{item.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color, flexShrink: 0 }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Spacer so sticky button doesn't cover last item */}
          <div style={{ height: 72 }} />
        </div>
      </div>

      {/* PO Dialog */}
      {showDialog && (
        <div className="dialog-overlay" onClick={e => { if (e.target === e.currentTarget) setShowDialog(false); }}>
          <div className="dialog-panel">
            {orderConfirmed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(21,128,61,0.1)', border: '1.5px solid rgba(21,128,61,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Check style={{ width: 20, height: 20, color: '#15803d' }} />
                </div>
                <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 500, marginBottom: 8 }}>Purchase Order Submitted</h3>
                <p style={{ fontSize: 13, color: '#6B6860' }}>Stock levels updated successfully.</p>
              </div>
            ) : (
              <div style={{ padding: '1.75rem 2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 500 }}>
                    AI Bulk Order <em style={{ color: '#6B6860', fontStyle: 'italic' }}>Requisition</em>
                  </h2>
                  <button onClick={() => setShowDialog(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6860', padding: 4 }}>
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#6B6860', marginBottom: 16 }}>
                  {itemsToOrder.length} item{itemsToOrder.length !== 1 ? 's' : ''} flagged for reorder based on 7-day patient demand.
                </p>
                {itemsToOrder.map(item => {
                  const demand = Math.round(item.requested * 7);
                  const orderQty = Math.max(0, demand - item.stock);
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #E5E0D6' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#6B6860', marginTop: 2 }}>
                          Stock: {displayStock(item.stock, item.unit, weightUnit)} → Need: {displayStock(demand, item.unit, weightUnit)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: '1.4rem', color: '#1A1A18' }}>
                          {displayStock(orderQty, item.unit, weightUnit)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                  <button onClick={() => setShowDialog(false)} style={{ background: 'transparent', border: '1px solid #E5E0D6', color: '#6B6860', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmOrder}
                    disabled={submitting}
                    style={{ background: '#1C2B22', color: '#52B788', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                  >
                    {submitting ? 'Updating…' : 'Confirm & Submit PO'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BulkPlanButton
        inventory={inventoryData}
        onInventoryAdded={loadInventory}
      />
    </div>
  );
}