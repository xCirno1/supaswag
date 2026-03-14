"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

const HIDDEN_PATHS = ["/signin"];

export default function SidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <>
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
          <span className="sidebar-logo-text">
            Supa<span>care</span>
          </span>
        </div>

        {/* Nav */}
        <NavIcon href="/" title="Overview">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </NavIcon>

        <NavIcon href="/patients" title="Patients">
          <svg viewBox="0 0 24 24">
            <circle cx="9" cy="7" r="3" />
            <path d="M3 20c0-4 3-6 6-6s6 2 6 6" />
            <circle cx="17" cy="9" r="2" />
            <path d="M17 14c2.5 0 4 1.5 4 4.5" />
          </svg>
        </NavIcon>

        <NavIcon href="/meal-plans" title="Meal Plans">
          <svg viewBox="0 0 24 24">
            <path d="M3 11l19-9-9 19-2-8-8-2z" />
          </svg>
        </NavIcon>

        <NavIcon href="/inventory" title="Inventory">
          <svg viewBox="0 0 24 24">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        </NavIcon>

        <NavIcon href="/manage" title="Manage">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          </svg>
        </NavIcon>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <div className="sidebar-divider" />

        <NavIcon href="/settings" title="Settings">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </NavIcon>

        {/* User avatar + sign out */}
        <SignOutAvatar />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>
    </>
  );
}

function NavIcon({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`sidebar-nav-item${isActive ? " active" : ""}`}
      title={title}
    >
      <div className="nav-icon-wrap">{children}</div>
      <span className="nav-label">{title}</span>
    </Link>
  );
}

function SignOutAvatar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const initials = user
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "SC";

  const displayName = user?.name ?? "Staff";

  const handleSignOut = async () => {
    await logout();
    router.push("/signin");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      title="Sign out"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 16px",
        margin: "4px 0",
        overflow: "hidden",
        background: "none",
        border: "none",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div className="sidebar-avatar">{initials}</div>
      <span
        className="sidebar-avatar-label"
        style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}
      >
        {/* Name truncated, sign-out icon always visible on hover */}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </span>
    </button>
  );
}