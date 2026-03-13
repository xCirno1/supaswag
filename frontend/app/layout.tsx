import './globals.css';
import { Activity, Users, Utensils, Box, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'NutriCare AI', description: 'Healthcare Food Planning' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'DM Sans', sans-serif" }} className="flex h-screen bg-[#F7F5F0] text-stone-800">
        <style>{`
          .nav-link {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.6rem 0;
            font-size: 0.8rem;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            font-weight: 500;
            color: #a8a29e;
            border-bottom: 1px solid transparent;
            transition: color 0.2s ease, border-color 0.2s ease;
            text-decoration: none;
            position: relative;
          }

          .nav-link:hover {
            color: #1c1917;
            border-bottom-color: rgba(28,25,23,0.12);
          }

          .nav-link.active {
            color: #1c1917;
            border-bottom-color: #1c1917;
          }

          .nav-link svg {
            width: 1rem;
            height: 1rem;
            stroke-width: 1.75;
            flex-shrink: 0;
          }

          .wordmark {
            font-family: 'DM Serif Display', serif;
            font-size: 1.35rem;
            letter-spacing: -0.01em;
            color: #1c1917;
            line-height: 1;
          }

          .wordmark em {
            font-style: italic;
            color: #78716c;
          }

          .sidebar-rule {
            height: 1px;
            background: linear-gradient(to right, rgba(28,25,23,0.15), transparent);
          }

          .ai-badge {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.65rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-weight: 500;
          }

          .pulse {
            width: 0.375rem;
            height: 0.375rem;
            border-radius: 50%;
            background: #10b981;
            animation: pulse 2.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }

          .version-tag {
            font-size: 0.6rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #d6d3d1;
            font-weight: 400;
          }
        `}</style>

        {/* Sidebar */}
        <aside
          className="flex flex-col"
          style={{
            width: '13rem',
            borderRight: '1px solid rgba(28,25,23,0.1)',
            background: '#F7F5F0',
            padding: '2rem 1.75rem',
            flexShrink: 0,
          }}
        >
          {/* Wordmark */}
          <div className="mb-8">
            <div className="wordmark">NutriCare <em>AI</em></div>
            <div className="version-tag mt-1">v2.4.1 · Clinical</div>
          </div>

          <div className="sidebar-rule mb-7" />

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 flex-1">
            <NavItem href="/" icon={<Activity />} label="Overview" />
            <NavItem href="/patients" icon={<Users />} label="Patients" />
            <NavItem href="/meal-plans" icon={<Utensils />} label="Meal Plans" />
            <NavItem href="/inventory" icon={<Box />} label="Inventory" />
          </nav>

          {/* AI Status */}
          <div>
            <div className="sidebar-rule mb-5" />
            <div className="ai-badge text-emerald-600 mb-2">
              <span className="pulse" />
              AI Active
            </div>
            <p style={{ fontSize: '0.7rem', color: '#a8a29e', lineHeight: '1.5' }}>
              EHR cross-referencing<br />running in real-time
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto" style={{ padding: '3rem 3.5rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="nav-link">
      {icon}
      {label}
    </Link>
  );
}