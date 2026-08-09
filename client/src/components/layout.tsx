import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card } from "./ui";

type NavItem = {
  label: string;
  to: string;
  roles: Array<"ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS">;
};

function getInitials(name?: string | null) {
  if (!name) {
    return "U";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts.length === 0
    ? "U"
    : parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

function titleize(segment: string) {
  return segment
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

const navSections = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", to: "/", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] }]
  },
  {
    title: "CRM",
    items: [
      { label: "Customers", to: "/customers", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
      { label: "Follow Ups", to: "/follow-ups", roles: ["ADMIN", "SALES"] }
    ]
  },
  {
    title: "Inventory",
    items: [
      { label: "Products", to: "/products", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
      { label: "Stock Movements", to: "/inventory", roles: ["ADMIN", "WAREHOUSE"] }
    ]
  },
  {
    title: "Sales",
    items: [{ label: "Challans", to: "/challans", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] }]
  }
] satisfies Array<{ title: string; items: NavItem[] }>;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, canAccess } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="content-wrap">{children}</main>
      </div>
    </div>
  );

  function Sidebar() {
    return (
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">FR</div>
          <div>
            <div className="brand-name">FundsRoom</div>
            <div className="brand-subtitle">ERP CRM</div>
          </div>
        </div>

        <div className="nav-sections">
          {navSections.map((section) => {
            const items = section.items.filter((item) => canAccess(item.roles));

            if (items.length === 0) {
              return null;
            }

            return (
              <div key={section.title} className="nav-section">
                <div className="nav-section-title">{section.title}</div>
                <div className="nav-links">
                  {items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`.trim()}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Card className="sidebar-user-card">
          <div className="sidebar-user-top">
            <div className="avatar">{getInitials(user?.name)}</div>
            <div>
              <div className="sidebar-user-name">{user?.name ?? "Unknown"}</div>
              <Badge tone="info">{user?.role ?? ""}</Badge>
            </div>
          </div>
          <Button variant="secondary" onClick={logout} className="full-width">
            Logout
          </Button>
        </Card>
      </aside>
    );
  }

  function Topbar() {
    const location = useLocation();
    const parts = location.pathname.split("/").filter(Boolean);
    const pageTitle = parts.length > 0 ? parts.map(titleize).join(" / ") : "Dashboard";

    return (
      <header className="topbar">
        <div>
          <div className="breadcrumb">FundsRoom / {pageTitle}</div>
          <h1 className="topbar-title">{pageTitle}</h1>
        </div>
        <div className="topbar-meta">
          <div className="user-pill">
            <div className="avatar small">{getInitials(user?.name)}</div>
            <div>
              <div className="user-pill-name">{user?.name}</div>
              <div className="user-pill-role">{user?.role}</div>
            </div>
          </div>
        </div>
      </header>
    );
  }
}

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </div>
  );
}