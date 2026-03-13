import { getInventoryNeeds, InventoryNeed } from '@/lib/api';
import { ShoppingCart, ArrowUpRight } from 'lucide-react';

export default async function InventoryPage() {
  let inventoryData: InventoryNeed[] = [];

  try {
    inventoryData = await getInventoryNeeds();
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
        <div className="text-center p-8 border border-stone-200 bg-white rounded-sm">
          <h2 className="font-['DM_Serif_Display'] text-xl mb-2">System Offline</h2>
          <p className="text-stone-500 text-sm">Unable to connect to the facility database.</p>
        </div>
      </div>
    );
  }

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
      `}</style>

      <div className="max-w-5xl mx-auto px-8 py-12">

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

        {/* Footer action */}
        <div
          className="flex justify-end mt-10 pt-6"
          style={{ borderTop: '1px solid rgba(26,26,26,0.10)' }}
        >
          <button className="po-btn">
            <ShoppingCart className="w-3.5 h-3.5 opacity-75" />
            Generate AI Bulk Order PO
            <ArrowUpRight className="w-3 h-3 opacity-50" />
          </button>
        </div>

      </div>
    </div>
  );
}