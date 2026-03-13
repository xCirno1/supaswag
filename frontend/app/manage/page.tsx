"use client"
import { useState, useEffect } from 'react';
import { getPatients, getInventory, InventoryItem, Patient } from '@/lib/api';
import { addPatientAction, removePatientAction, updateStockAction, addInventoryAction } from './actions';
import { Trash2, Plus, Save } from 'lucide-react';

export default function ManagePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const refresh = async () => {
    try {
      const [p, i] = await Promise.all([getPatients(), getInventory()]);
      setPatients(p);
      setInventory(i);
    } catch (error) {
      console.error("Management API unreachable:", error);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await addPatientAction({
      name: fd.get('name') as string,
      age: parseInt(fd.get('age') as string, 10),
      room: fd.get('room') as string,
      medications: fd.getAll('medications') as string[],
      allergies: fd.getAll('allergies') as string[],
    });
    e.currentTarget.reset();
    refresh();
  };

  const handleRemovePatient = async (id: string) => {
    await removePatientAction(id);
    refresh();
  };

  const handleUpdateStock = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await updateStockAction(id, parseInt(fd.get('stock') as string, 10));
    refresh();
  };

  const handleAddInventory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await addInventoryAction({
      name: fd.get('name') as string,
      unit: fd.get('unit') as string,
      stock: parseInt(fd.get('stock') as string, 10),
    });
    e.currentTarget.reset();
    refresh();
  };

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

        .pulse-dot {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Checkbox-style multi-select */
        .toggle-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .toggle-group input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .toggle-group label {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          border: 1px solid #e2ded9;
          background: #fff;
          color: #78716c;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
          line-height: 1.4;
        }

        .toggle-group label:hover {
          border-color: #a8a29e;
          color: #44403c;
        }

        .toggle-group input[type="checkbox"]:checked + label {
          background: #1c1917;
          border-color: #1c1917;
          color: #f5f0e8;
        }

        /* Inventory card add form */
        .inv-add-card {
          background: white;
          border: 1.5px dashed #d6d3d1;
          border-radius: 2px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .field-label {
          display: block;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #78716c;
          font-weight: 500;
          margin-bottom: 0.375rem;
        }

        .field-input {
          width: 100%;
          border: 1px solid #e7e5e4;
          padding: 0.5rem 0.75rem;
          border-radius: 2px;
          font-size: 0.8125rem;
          font-family: inherit;
          color: #1c1917;
          background: #fafaf9;
          transition: border-color 0.15s;
          outline: none;
          box-sizing: border-box;
        }

        .field-input:focus {
          border-color: #a8a29e;
          background: #fff;
        }

        .field-input::placeholder {
          color: #c4bfba;
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
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

        {/* Patient Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Add Patient */}
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

              {/* Medications — toggle pills */}
              <div>
                <label className="field-label">Medications</label>
                <div className="toggle-group">
                  {['None', 'Warfarin', 'Lisinopril', 'Metformin', 'MAOI'].map(med => (
                    <span key={med}>
                      <input type="checkbox" name="medications" value={med} id={`med-${med}`} />
                      <label htmlFor={`med-${med}`}>{med}</label>
                    </span>
                  ))}
                </div>
              </div>

              {/* Allergies — toggle pills */}
              <div>
                <label className="field-label">Allergies</label>
                <div className="toggle-group">
                  {['None', 'Peanuts', 'Shellfish', 'Dairy', 'Gluten'].map(allergy => (
                    <span key={allergy}>
                      <input type="checkbox" name="allergies" value={allergy} id={`allergy-${allergy}`} />
                      <label htmlFor={`allergy-${allergy}`}>{allergy}</label>
                    </span>
                  ))}
                </div>
              </div>

              <button type="submit" className="flex items-center justify-center gap-2 w-full bg-stone-900 text-stone-50 py-3 mt-2 text-[0.7rem] tracking-widest uppercase font-medium rounded-sm hover:bg-stone-800 transition-colors">
                <Plus className="w-4 h-4" /> Admit Patient
              </button>
            </form>
          </div>

          {/* Current Patients */}
          <div>
            <h2 className="font-['DM_Serif_Display',serif] text-xl text-stone-900 mb-5">Active Roster</h2>
            <div className="bg-white border border-stone-200/60 rounded-sm shadow-sm overflow-hidden">
              {patients.length === 0 ? (
                <div className="p-6 text-center text-sm text-stone-400">No active patients.</div>
              ) : (
                patients.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors">
                    <div>
                      <div className="font-medium text-stone-900 text-sm">{p.name}</div>
                      <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                        <span>Room {p.room}</span>
                        <span className="w-1 h-1 rounded-full bg-stone-300" />
                        <span className="text-[0.65rem] tracking-wider uppercase">{p.id}</span>
                      </div>
                    </div>
                    <form action={removePatientAction.bind(null, p.id)}>
                      <button onClick={() => handleRemovePatient(p.id)} type="button" className="text-stone-400 hover:text-rose-600 p-2 transition-colors" title="Discharge Patient">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rule-line mb-10" />

        {/* Inventory Management */}
        <div>
          <h2 className="font-['DM_Serif_Display',serif] text-xl text-stone-900 mb-5">Inventory Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Existing inventory cards */}
            {inventory.map(item => (
              <form onSubmit={(e) => handleUpdateStock(item.id, e)} className="bg-white p-5 border border-stone-200/60 rounded-sm shadow-sm flex flex-col gap-4">
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

            {/* Add New Inventory Item card */}
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

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full mt-1 bg-stone-900 text-stone-50 py-2.5 text-[0.68rem] tracking-widest uppercase font-medium rounded-sm hover:bg-stone-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}