import './globals.css';
import { SettingsProvider } from '@/lib/settingsContext';
import { AuthProvider } from '@/lib/authContext';
import SidebarShell from './SidebarShell';

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
      <body
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        className="flex h-screen bg-[#F9F6F1] text-[#1A1A18] overflow-hidden"
      >
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
          .sidebar:hover { width: var(--sidebar-expanded-w); }

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
            width: 36px; height: 36px;
            background: #52B788;
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          .sidebar-logo-text {
            font-family: 'Fraunces', serif;
            font-size: 15px; font-weight: 500; color: #fff;
            opacity: 0; transform: translateX(-6px);
            transition: opacity 0.18s ease 0.06s, transform 0.18s ease 0.06s;
            pointer-events: none; white-space: nowrap;
          }
          .sidebar-logo-text span { color: #52B788; }
          .sidebar:hover .sidebar-logo-text { opacity: 1; transform: translateX(0); }

          .sidebar-nav-item {
            height: 40px; border-radius: 10px;
            display: flex; align-items: center; gap: 10px;
            cursor: pointer; transition: background 0.15s;
            text-decoration: none;
            margin: 0 12px; padding: 0 4px;
            overflow: hidden; white-space: nowrap; flex-shrink: 0;
          }
          .sidebar-nav-item:hover { background: rgba(255,255,255,0.1); }
          .sidebar-nav-item.active { background: rgba(82,183,136,0.25); }

          .nav-icon-wrap {
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          .sidebar-nav-item svg {
            width: 18px; height: 18px;
            stroke: rgba(255,255,255,0.5); fill: none;
            stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round;
            transition: stroke 0.15s; flex-shrink: 0;
          }
          .sidebar-nav-item:hover svg { stroke: rgba(255,255,255,0.8); }
          .sidebar-nav-item.active svg { stroke: #52B788; }

          .nav-label {
            font-size: 13px; font-weight: 500;
            color: rgba(255,255,255,0.55);
            opacity: 0; transform: translateX(-6px);
            transition: opacity 0.18s ease 0.07s, transform 0.18s ease 0.07s;
            pointer-events: none; white-space: nowrap; overflow: hidden;
          }
          .sidebar:hover .nav-label { opacity: 1; transform: translateX(0); }
          .sidebar-nav-item:hover .nav-label { color: rgba(255,255,255,0.9); }
          .sidebar-nav-item.active .nav-label { color: #52B788; }

          .sidebar-avatar {
            width: 32px; height: 32px; border-radius: 50%;
            background: #52B788;
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 500; color: white;
            flex-shrink: 0;
          }
          .sidebar-avatar-label {
            font-size: 12px; color: rgba(255,255,255,0.5);
            opacity: 0; transform: translateX(-6px);
            transition: opacity 0.18s ease 0.07s, transform 0.18s ease 0.07s;
            white-space: nowrap; flex: 1; min-width: 0;
            display: flex; align-items: center; gap: 5px;
          }
          .sidebar:hover .sidebar-avatar-label { opacity: 1; transform: translateX(0); }

          .sidebar-divider {
            height: 1px; background: rgba(255,255,255,0.07);
            margin: 6px 14px; flex-shrink: 0;
          }

          .badge { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; }
          .badge-green { background: #D8EED8; color: #1A4731; }
          .badge-amber { background: #FAEEDA; color: #7A3E0D; }
          .badge-red   { background: #FCEBEB; color: #A32D2D; }
          .badge-teal  { background: #E1F5EE; color: #0F6E56; }
        `}</style>

        <AuthProvider>
          <SettingsProvider>
            <SidebarShell>{children}</SidebarShell>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}