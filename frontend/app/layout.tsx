import './globals.css';
import Link from 'next/link';
import { SettingsProvider } from '@/lib/settings-context';

export const metadata = { title: 'SupaCare', description: 'Healthcare Food Planning' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'DM Sans', sans-serif" }} className="flex h-screen bg-[#F9F6F1] text-[#1A1A18] overflow-hidden">
        <style>{`
          :root {
            --bg: #F9F6F1;
            --card: #FFFFFF;
            --green: #2D6A4F;
            --green-light: #D8EED8;
            --green-mid: #52B788;
            --amber: #B5641B;
            --amber-light: #FAEEDA;
            --red-light: #FCEBEB;
            --red: #A32D2D;
            --teal: #0F6E56;
            --teal-light: #E1F5EE;
            --text: #1A1A18;
            --muted: #6B6860;
            --hint: #A8A59F;
            --border: #E5E0D6;
            --sidebar-w: 64px;
            --sidebar-expanded-w: 192px;
          }

          /* ── Sidebar ────────────────────────────────────────────── */
          .sidebar {
            width: var(--sidebar-w);
            background: #1C2B22;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding: 14px 0;
            gap: 2px;
            flex-shrink: 0;
            overflow: hidden;
            transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            z-index: 30;
          }
          .sidebar:hover {
            width: var(--sidebar-expanded-w);
          }

          /* Logo row */
          .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 13px;
            margin-bottom: 10px;
            height: 36px;
            flex-shrink: 0;
            overflow: hidden;
            white-space: nowrap;
          }
          .sidebar-logo-mark {
            width: 36px;
            height: 36px;
            background: #52B788;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .sidebar-logo-text {
            font-family: 'Fraunces', serif;
            font-size: 15px;
            font-weight: 500;
            color: #fff;
            opacity: 0;
            transform: translateX(-6px);
            transition: opacity 0.18s ease 0.06s, transform 0.18s ease 0.06s;
            pointer-events: none;
            white-space: nowrap;
          }
          .sidebar-logo-text span { color: #52B788; }
          .sidebar:hover .sidebar-logo-text {
            opacity: 1;
            transform: translateX(0);
          }

          /* Nav items */
          .sidebar-nav-item {
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: background 0.15s;
            text-decoration: none;
            margin: 0 12px;
            padding: 0 4px;
            overflow: hidden;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .sidebar-nav-item:hover { background: rgba(255,255,255,0.1); }
          .sidebar-nav-item.active { background: rgba(82,183,136,0.25); }

          /* Icon wrapper — fixed width so icon stays centered at 40px */
          .nav-icon-wrap {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .sidebar-nav-item svg {
            width: 18px; height: 18px;
            stroke: rgba(255,255,255,0.5); fill: none;
            stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round;
            transition: stroke 0.15s;
            flex-shrink: 0;
          }
          .sidebar-nav-item:hover svg { stroke: rgba(255,255,255,0.8); }
          .sidebar-nav-item.active svg { stroke: #52B788; }

          /* Label that fades in */
          .nav-label {
            font-size: 13px;
            font-weight: 500;
            color: rgba(255,255,255,0.55);
            opacity: 0;
            transform: translateX(-6px);
            transition: opacity 0.18s ease 0.07s, transform 0.18s ease 0.07s;
            pointer-events: none;
            white-space: nowrap;
            overflow: hidden;
          }
          .sidebar:hover .nav-label {
            opacity: 1;
            transform: translateX(0);
          }
          .sidebar-nav-item:hover .nav-label { color: rgba(255,255,255,0.9); }
          .sidebar-nav-item.active .nav-label { color: #52B788; }

          /* Avatar */
          .sidebar-avatar {
            width: 32px; height: 32px; border-radius: 50%;
            background: #52B788;
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 500; color: white;
            flex-shrink: 0;
          }
          .sidebar-avatar-label {
            font-size: 12px;
            color: rgba(255,255,255,0.5);
            opacity: 0;
            transform: translateX(-6px);
            transition: opacity 0.18s ease 0.07s, transform 0.18s ease 0.07s;
            white-space: nowrap;
          }
          .sidebar:hover .sidebar-avatar-label {
            opacity: 1;
            transform: translateX(0);
          }

          /* Divider */
          .sidebar-divider {
            height: 1px;
            background: rgba(255,255,255,0.07);
            margin: 6px 14px;
            flex-shrink: 0;
          }

          /* Badges (unchanged) */
          .badge { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; }
          .badge-green { background: #D8EED8; color: #1A4731; }
          .badge-amber { background: #FAEEDA; color: #7A3E0D; }
          .badge-red { background: #FCEBEB; color: #A32D2D; }
          .badge-teal { background: #E1F5EE; color: #0F6E56; }
        `}</style>

        {/* Expandable Sidebar */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="sidebar-logo">
            <div className="sidebar-logo-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 3C8 3 5 6 5 10c0 2 1 4 3 5.5l2 1.5v2h4v-2l2-1.5C18 14 19 12 19 10c0-4-3-7-7-7z" />
                <rect x="9" y="18" width="6" height="1.5" rx="0.75" />
                <rect x="10" y="20" width="4" height="1.5" rx="0.75" />
              </svg>
            </div>
            <span className="sidebar-logo-text">Supa<span>care</span></span>
          </div>

          {/* Nav */}
          <NavIcon href="/" title="Overview">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          </NavIcon>

          <NavIcon href="/patients" title="Patients">
            <svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="3" /><path d="M3 20c0-4 3-6 6-6s6 2 6 6" /><circle cx="17" cy="9" r="2" /><path d="M17 14c2.5 0 4 1.5 4 4.5" /></svg>
          </NavIcon>

          <NavIcon href="/meal-plans" title="Meal Plans">
            <svg viewBox="0 0 24 24"><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>
          </NavIcon>

          <NavIcon href="/inventory" title="Inventory">
            <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
          </NavIcon>

          <NavIcon href="/manage" title="Manage">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>
          </NavIcon>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          <div className="sidebar-divider" />

          {/* Settings */}
          <NavIcon href="/settings" title="Settings">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </NavIcon>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', margin: '4px 0', overflow: 'hidden' }}>
            <div className="sidebar-avatar">SC</div>
            <span className="sidebar-avatar-label">Staff</span>
          </div>
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </div>
      </body>
    </html>
  );
}

function NavIcon({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="sidebar-nav-item" title={title}>
      <div className="nav-icon-wrap">
        {children}
      </div>
      <span className="nav-label">{title}</span>
    </Link>
  );
}