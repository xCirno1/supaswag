"use client"
import { useState, useEffect } from 'react';
import { getInventoryNeeds, updateInventoryStock, InventoryNeed } from '@/lib/api';
import { ShoppingCart, ArrowUpRight, X, Check, Package, AlertCircle, ChevronRight } from 'lucide-react';

export default function InventoryPage() {
  const [inventoryData, setInventoryData] = useState<InventoryNeed[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getInventoryNeeds()
      .then(setInventoryData)
      .catch((err) => {
        console.error("Patient API unreachable:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const itemsToOrder = inventoryData.filter(i => i.status === 'ORDER NOW');

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    try {
      await Promise.all(
        itemsToOrder.map(item => {
          const orderQty = Math.max(0, Math.round(item.requested * 7) - item.stock);
          return updateInventoryStock(item.id, item.stock + orderQty);
        })
      );
      // Refresh table data to reflect new stock levels
      const updated = await getInventoryNeeds();
      setInventoryData(updated);
      setOrderConfirmed(true);
      setTimeout(() => {
        setShowDialog(false);
        setOrderConfirmed(false);
      }, 2200);
    } catch (err) {
      console.error('Failed to update inventory:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <p className="text-stone-400 text-sm">Loading...</p>
    </div>
  );
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

        .inv-table {
          width: 100%;
          border-collapse: collapse;
        }

        .inv-table thead tr {
          border-top: 1px solid rgba(26,26,26,0.12);
          border-bottom: 1px solid rgba(26,26,26,0.12);
        }

        .inv-table th {
          padding: 0.85rem 1rem;
          text-align: left;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
          color: #78716c;
        }

        .inv-table th:first-child { padding-left: 0; }

        .inv-table td {
          padding: 1.1rem 1rem;
          border-bottom: 1px solid rgba(26,26,26,0.07);
          vertical-align: top;
        }

        .inv-table td:first-child { padding-left: 0; }
        .inv-table tbody tr:last-child td { border-bottom: none; }
        .inv-table tbody tr:hover td { background: rgba(26,26,26,0.02); transition: background 0.15s ease; }

        .row-anim {
          opacity: 0;
          transform: translateY(6px);
          animation: fadeSlide 0.35s ease forwards;
        }

        .row-anim:nth-child(1) { animation-delay: 0.05s; }
        .row-anim:nth-child(2) { animation-delay: 0.12s; }
        .row-anim:nth-child(3) { animation-delay: 0.19s; }
        .row-anim:nth-child(4) { animation-delay: 0.26s; }
        .row-anim:nth-child(5) { animation-delay: 0.33s; }
        .row-anim:nth-child(6) { animation-delay: 0.40s; }
        .row-anim:nth-child(7) { animation-delay: 0.47s; }

        @keyframes fadeSlide {
          to { opacity: 1; transform: translateY(0); }
        }

        .status-order {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
          color: #9f3a38;
          border: 1px solid rgba(159,58,56,0.25);
          padding: 3px 10px;
          border-radius: 20px;
          background: rgba(159,58,56,0.06);
          white-space: nowrap;
        }

        .status-ok {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
          color: #3d7a5a;
          border: 1px solid rgba(61,122,90,0.25);
          padding: 3px 10px;
          border-radius: 20px;
          background: rgba(61,122,90,0.06);
          white-space: nowrap;
        }

        .demand-bar-bg {
          flex: 1;
          max-width: 80px;
          height: 3px;
          background: rgba(26,26,26,0.08);
          border-radius: 2px;
          overflow: hidden;
        }

        .demand-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: #b45309;
        }

        .demand-bar-fill.ok {
          background: #4d9970;
        }

        /* Sticky footer bar */
        .sticky-bar {
          position: fixed;
          bottom: 0;
          /* offset for the sidebar width (13rem) */
          left: 13rem;
          right: 0;
          background: rgba(247,245,240,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(26,26,26,0.10);
          padding: 1rem 3.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 40;
          animation: slideUp 0.3s ease forwards;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .po-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #1c1917;
          color: #f5f0e8;
          padding: 0.75rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
          border: none;
          cursor: pointer;
          border-radius: 2px;
          transition: background 0.2s;
        }

        .po-btn:hover {
          background: #3d342e;
        }

        /* Dialog overlay */
        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(28,25,23,0.45);
          backdrop-filter: blur(4px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .dialog-panel {
          background: #F7F5F0;
          border: 1px solid rgba(26,26,26,0.12);
          border-radius: 4px;
          width: 100%;
          max-width: 560px;
          max-height: 85vh;
          overflow-y: auto;
          margin: 1rem;
          animation: scaleIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .dialog-header {
          padding: 2rem 2rem 0;
        }

        .dialog-body {
          padding: 1.25rem 2rem;
        }

        .dialog-footer {
          padding: 1rem 2rem 1.75rem;
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          border-top: 1px solid rgba(26,26,26,0.08);
        }

        .order-line {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.9rem 0;
          border-bottom: 1px solid rgba(26,26,26,0.07);
        }

        .order-line:last-child {
          border-bottom: none;
        }

        .order-qty {
          font-family: 'DM Serif Display', serif;
          font-size: 1.4rem;
          color: #1c1917;
          line-height: 1;
          min-width: 3rem;
          text-align: right;
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid rgba(26,26,26,0.18);
          color: #78716c;
          padding: 0.65rem 1.25rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          font-weight: 500;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-cancel:hover {
          border-color: rgba(26,26,26,0.35);
          color: #1c1917;
        }

        .btn-confirm {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #1c1917;
          color: #f5f0e8;
          padding: 0.65rem 1.4rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          font-weight: 500;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-confirm:hover {
          background: #3d342e;
        }

        .btn-confirm.success {
          background: #15803d;
        }

        .confirmed-anim {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
          animation: fadeIn 0.3s ease;
        }

        .check-circle {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: rgba(21,128,61,0.1);
          border: 1.5px solid rgba(21,128,61,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes popIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }

        /* add bottom padding so table content isn't hidden behind sticky bar */
        .table-wrapper {
          padding-bottom: 5rem;
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-8 py-12 table-wrapper">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-1">
            <span className="tag text-stone-400">Inventory Management</span>
            <span className="tag text-stone-400">AI-Assisted Forecasting</span>
          </div>
          <div className="rule-line" />
          <h1 className="text-[2.2rem] font-['DM_Serif_Display',serif] text-stone-900 mt-3 leading-tight">
            Bulk Inventory<br /><em>&amp; Demand Forecast</em>
          </h1>
          <p className="text-stone-500 text-sm mt-2">
            Cross-referencing stock against aggregate patient dietary restrictions.
          </p>
        </div>

        {/* Table */}
        <table className="inv-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Current Stock</th>
              <th>7-Day Demand</th>
              <th>Status</th>
              <th>AI Insight</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.map(item => {
              const isOrder = item.status === 'ORDER NOW';
              const demandTotal = item.requested * 7;
              const pct = Math.min(100, Math.round((item.stock / demandTotal) * 100));

              return (
                <tr key={item.id} className="row-anim">

                  {/* Item name + tags */}
                  <td>
                    <div className="font-medium text-stone-900 text-sm">{item.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.tags.map(t => (
                        <span
                          key={t}
                          className="text-[0.6rem] tracking-wider uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Current stock */}
                  <td>
                    <span className="text-stone-700 text-sm tabular-nums">{item.stock}</span>
                    <span className="text-stone-400 text-xs ml-1">{item.unit}</span>
                  </td>

                  {/* 7-day demand + bar */}
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-700 text-sm tabular-nums">{Math.round(demandTotal)}</span>
                      <span className="text-stone-400 text-xs">{item.unit}</span>
                      <div className="demand-bar-bg">
                        <div
                          className={`demand-bar-fill${isOrder ? '' : ' ok'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="pt-5">
                    <span className={isOrder ? 'status-order' : 'status-ok'}>
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ background: isOrder ? '#e57373' : '#5aab7d' }}
                      />
                      {item.status}
                    </span>
                  </td>

                  {/* AI Insight */}
                  <td>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: item.blockedCount > 0 ? '#92400e' : '#78716c', fontWeight: item.blockedCount > 0 ? 500 : 400 }}
                    >
                      {item.aiInsight}
                    </p>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sticky footer bar */}
      <div className="sticky-bar">
        <div>
          {itemsToOrder.length > 0 ? (
            <span className="tag text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              {itemsToOrder.length} item{itemsToOrder.length !== 1 ? 's' : ''} require restocking
            </span>
          ) : (
            <span className="tag text-emerald-600 flex items-center gap-1.5">
              <Check className="w-3 h-3" />
              All inventory levels sufficient
            </span>
          )}
        </div>
        <button className="po-btn" onClick={() => setShowDialog(true)}>
          <ShoppingCart className="w-3.5 h-3.5 opacity-75" />
          Generate AI Bulk Order PO
          <ArrowUpRight className="w-3 h-3 opacity-50" />
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showDialog && (
        <div className="dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDialog(false); }}>
          <div className="dialog-panel">

            {orderConfirmed ? (
              <div className="confirmed-anim">
                <div className="check-circle">
                  <Check className="w-5 h-5 text-green-700" />
                </div>
                <h3 className="font-['DM_Serif_Display',serif] text-xl text-stone-900 mb-2">Purchase Order Submitted</h3>
                <p className="text-stone-500 text-sm">
                  Your bulk order PO has been generated and sent to procurement.
                </p>
              </div>
            ) : (
              <>
                <div className="dialog-header">
                  <div className="flex items-center justify-between mb-3">
                    <span className="tag text-stone-400 flex items-center gap-1.5">
                      <Package className="w-3 h-3" />
                      Purchase Order Preview
                    </span>
                    <button
                      onClick={() => setShowDialog(false)}
                      className="text-stone-400 hover:text-stone-700 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div style={{ height: '1px', background: 'linear-gradient(to right, #1a1a1a 60%, transparent)', opacity: 0.12 }} />
                  <h2 className="font-['DM_Serif_Display',serif] text-[1.7rem] text-stone-900 mt-3 leading-tight">
                    AI Bulk Order<br /><em>Requisition</em>
                  </h2>
                  <p className="text-stone-500 text-xs mt-1.5 mb-4">
                    {itemsToOrder.length > 0
                      ? `${itemsToOrder.length} item${itemsToOrder.length !== 1 ? 's' : ''} flagged for reorder based on 7-day patient demand.`
                      : 'All inventory levels are currently sufficient.'}
                  </p>
                </div>

                <div className="dialog-body">
                  {itemsToOrder.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-stone-500 text-sm">No items need to be ordered at this time.</p>
                    </div>
                  ) : (
                    <>
                      {/* Column headers */}
                      <div className="flex items-center gap-4 pb-2 mb-1" style={{ borderBottom: '1px solid rgba(26,26,26,0.1)' }}>
                        <span className="tag text-stone-400 flex-1">Item</span>
                        <span className="tag text-stone-400 w-24 text-right">Current</span>
                        <span className="tag text-stone-400 w-24 text-right">7-Day Need</span>
                        <span className="tag text-stone-400 w-20 text-right">Order Qty</span>
                      </div>

                      {itemsToOrder.map((item) => {
                        const demand = Math.round(item.requested * 7);
                        const orderQty = Math.max(0, demand - item.stock);
                        return (
                          <div key={item.id} className="order-line">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-stone-900 text-sm">{item.name}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.tags.slice(0, 2).map(t => (
                                  <span key={t} className="text-[0.58rem] tracking-wider uppercase bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-full">
                                    {t}
                                  </span>
                                ))}
                              </div>
                              {item.blockedCount > 0 && (
                                <p className="text-[0.65rem] text-amber-700 mt-1 leading-snug">{item.aiInsight}</p>
                              )}
                            </div>
                            <div className="w-24 text-right">
                              <span className="text-stone-500 text-sm tabular-nums">{item.stock}</span>
                              <span className="text-stone-400 text-xs ml-0.5">{item.unit}</span>
                            </div>
                            <div className="w-24 text-right">
                              <span className="text-stone-500 text-sm tabular-nums">{demand}</span>
                              <span className="text-stone-400 text-xs ml-0.5">{item.unit}</span>
                            </div>
                            <div className="w-20 text-right">
                              <span className="order-qty">{orderQty}</span>
                              <span className="text-stone-400 text-xs block">{item.unit}</span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                <div className="dialog-footer">
                  <button className="btn-cancel" onClick={() => setShowDialog(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn-confirm"
                    onClick={handleConfirmOrder}
                    disabled={itemsToOrder.length === 0 || submitting}
                    style={{ opacity: itemsToOrder.length === 0 ? 0.4 : 1, cursor: itemsToOrder.length === 0 || submitting ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    {submitting ? 'Updating Stock…' : 'Confirm & Submit PO'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}