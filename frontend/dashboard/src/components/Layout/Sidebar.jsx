import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="px-4 py-4 border-b border-slate-800">
        <h1 className="text-sm font-semibold tracking-wide text-slate-100">
          Construction Billing
        </h1>
        <p className="text-[11px] text-slate-400">
          Dashboard · Materials · SSR/BOQ
        </p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 text-xs">
        <NavItem to="/" label="Dashboard" end />
        <NavItem to="/invoices/generate" label="Generate Invoice" />
        <NavItem to="/invoices" label="Invoice List" />
        <NavItem to="/materials" label="Manage Materials" />
        <NavItem to="/ssr-boq" label="SSR & BOQ Mapping" />
      </nav>
    </aside>
  );
}

function NavItem({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "block px-3 py-2 rounded-lg transition",
          "text-slate-300 hover:bg-slate-800 hover:text-white",
          isActive &&
            "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {label}
    </NavLink>
  );
}
