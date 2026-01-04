import React, { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function Layout({ children }) {
  const [dark, setDark] = useState(true);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar dark={dark} setDark={setDark} />
          <main className="flex-1 px-6 py-5 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
