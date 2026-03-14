"use client"
import { useSettings, WeightUnit, EnergyUnit } from '@/lib/settingsContext';

const WEIGHT_UNITS: { value: WeightUnit; label: string; desc: string }[] = [
  { value: 'g', label: 'g', desc: 'Grams' },
  { value: 'kg', label: 'kg', desc: 'Kilograms' },
  { value: 'oz', label: 'oz', desc: 'Ounces' },
  { value: 'lb', label: 'lb', desc: 'Pounds' },
];

const ENERGY_UNITS: { value: EnergyUnit; label: string; desc: string }[] = [
  { value: 'kcal', label: 'kcal', desc: 'Kilocalories' },
  { value: 'kJ', label: 'kJ', desc: 'Kilojoules' },
];

function UnitToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; desc: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="unit-toggle-group">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`unit-btn ${active ? 'active' : ''}`}
          >
            <span className="unit-label">{opt.label}</span>
            <span className="unit-desc">{opt.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const { weightUnit, energyUnit, setWeightUnit, setEnergyUnit } = useSettings();

  return (
    <div className="page-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,300&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --green-900: #0D4A35;
          --green-700: #0F6E56;
          --green-500: #52B788;
          --green-200: #B7E4C7;
          --green-100: #D8F3DC;
          --green-50:  #F0FAF4;
          --cream-100: #F9F6F1;
          --cream-200: #F0EBE3;
          --border:    #E5E0D6;
          --text-primary: #1A1A18;
          --text-secondary: #6B6860;
          --text-muted: #A8A59F;
          --white: #ffffff;
          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
        }

        .page-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: var(--cream-100);
          font-family: 'DM Sans', sans-serif;
          color: var(--text-primary);
        }

        /* ── Top bar ── */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          height: 56px;
          background: var(--white);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .topbar-brand {
          font-family: 'Fraunces', serif;
          font-size: 19px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.3px;
        }
        .topbar-brand span { color: var(--green-500); }
        .topbar-badge {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--green-700);
          background: var(--green-50);
          border: 1px solid var(--green-200);
          border-radius: 20px;
          padding: 4px 12px;
        }

        /* ── Scrollable body ── */
        .settings-body {
          flex: 1;
          overflow-y: auto;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          width: 100%;
        }

        /* ── Page header ── */
        .page-header { display: flex; flex-direction: column; gap: 6px; }
        .page-eyebrow {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .page-title {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.15;
          letter-spacing: -0.4px;
        }
        .page-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.65;
          max-width: 480px;
          margin-top: 2px;
        }

        /* ── Card ── */
        .card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
        }
        .card-header {
          padding: 20px 24px 18px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .card-header-text {}
        .card-title {
          font-family: 'Fraunces', serif;
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 3px;
        }
        .card-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.55; }

        /* ── Setting rows inside a card ── */
        .setting-item {
          padding: 22px 24px;
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 12px 24px;
          align-items: start;
        }
        .setting-item + .setting-item {
          border-top: 1px solid var(--border);
        }
        .setting-meta {}
        .setting-label {
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 3px;
        }
        .setting-hint {
          font-size: 11.5px;
          color: var(--text-muted);
          line-height: 1.55;
        }
        .setting-hint strong {
          color: var(--green-700);
          font-weight: 500;
        }

        /* ── Unit toggle buttons ── */
        .unit-toggle-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .unit-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 9px 16px;
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--border);
          background: var(--cream-100);
          color: var(--text-secondary);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, color 0.15s, box-shadow 0.15s;
          font-family: inherit;
          min-width: 64px;
        }
        .unit-btn:hover {
          border-color: var(--green-500);
          background: var(--white);
        }
        .unit-btn.active {
          border-color: var(--green-500);
          background: var(--green-50);
          color: var(--green-700);
          box-shadow: 0 0 0 3px rgba(82,183,136,0.12);
        }
        .unit-label {
          font-family: 'Fraunces', serif;
          font-size: 16px;
          font-weight: 500;
          line-height: 1;
        }
        .unit-desc {
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          line-height: 1;
        }

        /* ── Preview grid ── */
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: var(--border);
        }
        .preview-cell {
          background: var(--cream-100);
          padding: 18px 20px;
        }
        .preview-cell:first-child { border-radius: 0; }
        .preview-tag {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .preview-value {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1;
        }

        /* ── Info banner ── */
        .info-banner {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: var(--green-50);
          border: 1px solid var(--green-200);
          border-radius: var(--radius-md);
          padding: 14px 16px;
        }
        .info-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .info-text { font-size: 12px; color: var(--green-900); line-height: 1.65; }
      `}</style>

      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-brand">Supa<span>care</span></div>
        <span className="topbar-badge">Settings</span>
      </header>

      {/* Body */}
      <div className="settings-body">

        {/* Page header */}
        <div className="page-header">
          <div className="page-eyebrow">Facility Preferences</div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">
            Configure measurement units used across inventory, meal plans, and patient reports.
          </p>
        </div>

        {/* Measurement units card */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-text">
              <div className="card-title">Measurement Units</div>
              <div className="card-desc">
                Applied to all inventory quantities, food weights, portion sizes, and caloric values.
              </div>
            </div>
          </div>

          {/* Weight */}
          <div className="setting-item">
            <div className="setting-meta">
              <div className="setting-label">Weight Unit</div>
              <div className="setting-hint">
                Inventory stock &amp; food portions.<br />
                Active: <strong>{weightUnit}</strong>
              </div>
            </div>
            <UnitToggle options={WEIGHT_UNITS} value={weightUnit} onChange={setWeightUnit} />
          </div>

          {/* Energy */}
          <div className="setting-item">
            <div className="setting-meta">
              <div className="setting-label">Energy Unit</div>
              <div className="setting-hint">
                Meal plans &amp; nutritional summaries.<br />
                Active: <strong>{energyUnit}</strong>
              </div>
            </div>
            <UnitToggle options={ENERGY_UNITS} value={energyUnit} onChange={setEnergyUnit} />
          </div>
        </div>

        {/* Preview card */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-text">
              <div className="card-title">Live Preview</div>
              <div className="card-desc">How values will appear across the system with your current units.</div>
            </div>
          </div>
          <div className="preview-grid">
            {[
              { tag: 'Inventory Stock', val: `1,200 ${weightUnit}` },
              { tag: 'Weekly Demand', val: `350 ${weightUnit} / wk` },
              { tag: 'Breakfast', val: `320 ${energyUnit}` },
              { tag: 'Dinner', val: `480 ${energyUnit}` },
            ].map(({ tag, val }) => (
              <div className="preview-cell" key={tag}>
                <div className="preview-tag">{tag}</div>
                <div className="preview-value">{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Info note */}
        <div className="info-banner">
          <span className="info-icon">ℹ️</span>
          <p className="info-text">
            Settings are saved locally in your browser. They persist across sessions and apply immediately across all pages.
          </p>
        </div>

      </div>
    </div>
  );
}