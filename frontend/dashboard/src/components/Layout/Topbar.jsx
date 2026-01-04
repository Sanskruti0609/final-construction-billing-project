import React from "react";

export default function Topbar({ dark, setDark }) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="text-xs text-slate-300">
        <span className="font-semibold">Site:</span> Demo Pile Project · Andheri
      </div>
      <button
        onClick={() => setDark((d) => !d)}
        className="text-[11px] px-3 py-1 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-800"
      >
        {dark ? "Light mode" : "Dark mode"}
      </button>
    </header>
  );
}
