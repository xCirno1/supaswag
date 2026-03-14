import './globals.css';
import Link from 'next/link';

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
          }

          .sidebar-nav-item {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.15s;
            text-decoration: none;
          }
          .sidebar-nav-item:hover { background: rgba(255,255,255,0.1); }
          .sidebar-nav-item.active { background: rgba(82,183,136,0.25); }
          .sidebar-nav-item svg {
            width: 18px; height: 18px;
            stroke: rgba(255,255,255,0.5); fill: none;
            stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round;
            transition: stroke 0.15s;
          }
          .sidebar-nav-item:hover svg { stroke: rgba(255,255,255,0.8); }
          .sidebar-nav-item.active svg { stroke: #52B788; }

          .badge {
            font-size: 11px; font-weight: 500;
            padding: 3px 9px; border-radius: 20px;
          }
          .badge-green { background: #D8EED8; color: #1A4731; }
          .badge-amber { background: #FAEEDA; color: #7A3E0D; }
          .badge-red { background: #FCEBEB; color: #A32D2D; }
          .badge-teal { background: #E1F5EE; color: #0F6E56; }
        `}</style>

        {/* Icon Sidebar */}
        <aside style={{
          width: '64px',
          background: '#1C2B22',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
          gap: '6px',
          flexShrink: 0,
        }}>
          {/* Logo mark */}
          <div style={{
            width: 36, height: 36,
            background: '#52B788',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 8,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 3C8 3 5 6 5 10c0 2 1 4 3 5.5l2 1.5v2h4v-2l2-1.5C18 14 19 12 19 10c0-4-3-7-7-7z" />
              <rect x="9" y="18" width="6" height="1.5" rx="0.75" />
              <rect x="10" y="20" width="4" height="1.5" rx="0.75" />
            </svg>
          </div>

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

          <div style={{ flex: 1 }} />

          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#52B788',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500, color: 'white',
          }}>SC</div>
        </aside>

        {/* Main content fills the rest */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>
      </body>
    </html>
  );
}

function NavIcon({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="sidebar-nav-item" title={title}>
      {children}
    </Link>
  );
}