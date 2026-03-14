"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPatients, getInventoryNeeds, Patient, InventoryNeed } from '@/lib/api';
import { useAuth } from '@/lib/authContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [inventoryNeeds, setInventoryNeeds] = useState<InventoryNeed[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPatients(), getInventoryNeeds()])
      .then(([p, inv]) => { setPatients(p); setInventoryNeeds(inv); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const orderCount = inventoryNeeds.filter(i => i.status === 'ORDER NOW').length;
  const criticalPatients = patients.filter(p => (p.priority ?? 0) === 3);
  const highPatients = patients.filter(p => (p.priority ?? 0) === 2);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const roleLabel = user?.role === 'doctor' ? 'Doctor' : user?.role === 'food' ? 'Food Administrator' : 'Staff';
  const roleIcon = user?.role === 'doctor' ? '🩺' : user?.role === 'food' ? '🍽️' : '👤';
  const roleDesc = user?.role === 'doctor'
    ? 'You have access to patient records, AI dietary analysis, and meal plans.'
    : user?.role === 'food'
      ? 'You have access to inventory management, meal planning, and bulk food ordering.'
      : 'Welcome to SupaCare.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');

        .topbar { display:flex; align-items:center; gap:12px; padding:14px 24px; border-bottom:1px solid var(--border,#E5E0D6); background:#fff; flex-shrink:0; }
        .topbar-title { font-family:'Fraunces',serif; font-size:18px; font-weight:500; color:#1A1A18; flex:1; }
        .topbar-title span { color:#52B788; }

        .content-area { display:flex; flex:1; overflow:hidden; }

        /* Left list panel */
        .left-panel { width:260px; border-right:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; }
        .list-header { padding:14px 16px 8px; display:flex; align-items:center; justify-content:space-between; }
        .list-header-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; }

        .stat-row { padding:12px 16px; border-bottom:1px solid #E5E0D6; }
        .stat-label { font-size:10px; font-weight:500; color:#A8A59F; letter-spacing:0.07em; text-transform:uppercase; margin-bottom:4px; }
        .stat-value { font-family:'Fraunces',serif; font-size:2rem; line-height:1; color:#1A1A18; }
        .stat-value.amber { color:#B5641B; }
        .stat-value.red { color:#A32D2D; }
        .stat-sub { font-size:11px; color:#6B6860; margin-top:3px; }

        /* Center detail */
        .center-pane { flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:16px; }

        /* Right panel */
        .right-panel { width:220px; border-left:1px solid #E5E0D6; overflow-y:auto; background:#fff; flex-shrink:0; padding:16px; }
        .rp-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:10px; }
        .rp-section { margin-bottom:20px; }

        .info-card { background:#fff; border:1px solid #E5E0D6; border-radius:12px; padding:14px 16px; }
        .info-card-label { font-size:11px; font-weight:500; color:#6B6860; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:8px; }

        .patient-mini { display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid #E5E0D6; }
        .patient-mini:last-child { border-bottom:none; }
        .pm-avatar { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:500; flex-shrink:0; }
        .pm-name { font-size:12px; font-weight:500; flex:1; }
        .pm-room { font-size:10px; color:#A8A59F; }

        .action-btn { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; padding:6px 12px; border-radius:8px; border:1px solid #E5E0D6; background:#fff; cursor:pointer; color:#1A1A18; text-decoration:none; }
        .action-btn.primary { background:#2D6A4F; border-color:#2D6A4F; color:white; }
        .action-btn svg { width:13px; height:13px; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }

        .section-title { font-family:'Fraunces',serif; font-size:15px; font-weight:500; color:#1A1A18; margin-bottom:12px; }

        /* Welcome card */
        .welcome-card {
          background: linear-gradient(135deg, #1C2B22 0%, #2D4A38 100%);
          border-radius: 14px;
          padding: 24px 28px;
          position: relative;
          overflow: hidden;
        }
        .welcome-card::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: rgba(82,183,136,0.08);
          pointer-events: none;
        }
        .welcome-card::after {
          content: '';
          position: absolute;
          bottom: -60px; left: 20px;
          width: 140px; height: 140px;
          border-radius: 50%;
          background: rgba(82,183,136,0.05);
          pointer-events: none;
        }
        .welcome-greeting {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(82,183,136,0.7);
          margin-bottom: 6px;
        }
        .welcome-name {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 500;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 6px;
        }
        .welcome-name span { color: #52B788; font-style: italic; }
        .welcome-role-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .welcome-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
          background: rgba(82,183,136,0.15);
          color: #52B788;
          border: 1px solid rgba(82,183,136,0.25);
        }
        .welcome-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          line-height: 1.6;
          max-width: 420px;
        }
        .welcome-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 16px 0;
        }
        .welcome-stats-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .welcome-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .welcome-stat-value {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 500;
          color: #fff;
          line-height: 1;
        }
        .welcome-stat-value.amber { color: #EF9F27; }
        .welcome-stat-value.red   { color: #E24B4A; }
        .welcome-stat-value.green { color: #52B788; }
        .welcome-stat-label {
          font-size: 10px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.35s ease forwards; }
      `}</style>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-title">Supa<span>care</span></div>
        <span className="badge badge-green">Facility Overview</span>
        {error && <span className="badge badge-red">Backend Offline</span>}
      </div>

      <div className="content-area">

        {/* CENTER: Welcome + quick links */}
        <div className="center-pane">

          {/* Welcome card */}
          <div className="welcome-card fade-up">
            <div className="welcome-greeting">{greeting}</div>
            <div className="welcome-name">
              Welcome back, <span>{user?.name ?? 'Staff'}</span>
            </div>
            <div className="welcome-role-row">
              <span className="welcome-role-badge">
                <span>{roleIcon}</span>
                {roleLabel}
              </span>
            </div>
            <div className="welcome-desc">{roleDesc}</div>

            {!loading && (
              <>
                <div className="welcome-divider" />
                <div className="welcome-stats-row">
                  <div className="welcome-stat">
                    <div className="welcome-stat-value">{patients.length}</div>
                    <div className="welcome-stat-label">Patients</div>
                  </div>
                  <div className="welcome-stat">
                    <div className={`welcome-stat-value ${criticalPatients.length > 0 ? 'red' : 'green'}`}>
                      {criticalPatients.length}
                    </div>
                    <div className="welcome-stat-label">Critical</div>
                  </div>
                  <div className="welcome-stat">
                    <div className={`welcome-stat-value ${orderCount > 0 ? 'amber' : 'green'}`}>
                      {orderCount}
                    </div>
                    <div className="welcome-stat-label">Restock Alerts</div>
                  </div>
                  <div className="welcome-stat">
                    <div className="welcome-stat-value green">{inventoryNeeds.length}</div>
                    <div className="welcome-stat-label">Inventory Items</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick nav cards */}
          <div>
            <div className="section-title">Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { href: '/patients', label: 'View Patients', icon: '👥', desc: 'EHR directory & analysis' },
                { href: '/meal-plans', label: 'Meal Plans', icon: '🍽️', desc: 'AI-generated daily plans' },
                { href: '/inventory', label: 'Inventory', icon: '📦', desc: 'Stock & demand forecast' },
                { href: '/manage', label: 'Manage', icon: '⚙️', desc: 'Admit patients, edit stock' },
              ].map(({ href, label, icon, desc }) => (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  background: '#fff', border: '1px solid #E5E0D6', borderRadius: 12,
                  textDecoration: 'none', color: '#1A1A18',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#52B788'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(82,183,136,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E0D6'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#6B6860', marginTop: 2 }}>{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Priority patients + inventory alerts */}
        <div className="right-panel">
          {criticalPatients.length > 0 && (
            <div className="rp-section">
              <div style={{ background: '#FCEBEB', border: '1px solid #F5C4C4', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#A32D2D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E24B4A', display: 'inline-block', animation: 'pulse 1.8s infinite' }} />
                  Critical patients
                </div>
                {criticalPatients.slice(0, 3).map(p => (
                  <Link key={p.id} href={`/patients/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0', textDecoration: 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FCEBEB', border: '1px solid #F5C4C4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: '#A32D2D' }}>
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#1A1A18' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: '#6B6860' }}>Room {p.room}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="rp-section">
            <div className="rp-label">Restock Alerts</div>
            {inventoryNeeds.filter(i => i.status === 'ORDER NOW').slice(0, 4).map(item => (
              <div key={item.id} style={{ background: '#F9F6F1', border: '1px solid #E5E0D6', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 12 }}>⚠️</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#A32D2D' }}>{item.name}</span>
                </div>
                <div style={{ fontSize: 10, color: '#6B6860' }}>Requested: {Math.round(item.requested * 7)} {item.unit}/week</div>
              </div>
            ))}
            {inventoryNeeds.filter(i => i.status === 'ORDER NOW').length === 0 && !loading && (
              <div style={{ background: '#D8EED8', border: '1px solid #b2ddb2', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#1A4731' }}>✓ All stock sufficient</div>
              </div>
            )}
          </div>

          <div className="rp-section">
            <div className="rp-label">Recent Patients</div>
            {patients.slice(0, 5).map(p => (
              <Link key={p.id} href={`/patients/${p.id}`} className="patient-mini" style={{ textDecoration: 'none' }}>
                <div className="pm-avatar" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                  {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <span className="pm-name" style={{ color: '#1A1A18' }}>{p.name}</span>
                <span className="pm-room">Rm {p.room}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}