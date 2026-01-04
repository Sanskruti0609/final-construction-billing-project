import React from "react";
import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout/Layout.jsx";

// PAGES (notice the paths)
import DashboardPage from "./pages/Dashboard.jsx";
import GenerateInvoicePage from "./pages/Invoices/GenerateInvoice.jsx";
import InvoiceListPage from "./pages/Invoices/InvoiceList.jsx";
import MaterialsPage from "./pages/Materials/Materials.jsx";
import SSRBOQPage from "./pages/SSRBOQ/SSRBOQ.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/invoices/generate" element={<GenerateInvoicePage />} />
          <Route path="/invoices" element={<InvoiceListPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/ssr-boq" element={<SSRBOQPage />} />
        </Routes>
      </Layout>
    </div>
  );
}
