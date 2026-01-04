// src/pages/Materials.jsx
import React, { useEffect, useState } from "react";
import MaterialForm from "./MaterialForm";

import {
  getMaterials,
  createMaterial,
  deleteMaterial,
  downloadMaterialsBillPdf,
  downloadMaterialsBillExcel,
} from "../../api/materials";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // bill format state (pdf / excel)
  const [billFormat, setBillFormat] = useState("pdf");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load materials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddMaterial(formData) {
    try {
      setSaving(true);
      await createMaterial(formData);
      setShowForm(false);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this material?")) return;
    try {
      await deleteMaterial(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleDownloadBill() {
    if (materials.length === 0) {
      alert("No materials to include in bill.");
      return;
    }

    if (billFormat === "pdf") {
      downloadMaterialsBillPdf();
    } else if (billFormat === "excel") {
      downloadMaterialsBillExcel();
    }
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Materials</h1>
          <p className="text-xs text-slate-400">
            SSR-linked materials with auto GST and total. These will be used in your bill.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Format selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Bill Format:</span>
            <select
              value={billFormat}
              onChange={(e) => setBillFormat(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg text-[11px] px-2 py-1 text-slate-100"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          <button
            onClick={handleDownloadBill}
            className="px-3 py-2 rounded-lg text-xs bg-indigo-500 hover:bg-indigo-600"
          >
            Download Bill
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-2 rounded-lg text-xs bg-emerald-500 hover:bg-emerald-600"
          >
            + Add Material
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-slate-400">Loading materials…</div>
      )}

      {error && (
        <div className="text-sm text-red-400 mb-2">Error: {error}</div>
      )}

      {!loading && materials.length === 0 && !error && (
        <div className="text-sm text-slate-500">
          No materials added yet. Click &quot;+ Add Material&quot; to start.
        </div>
      )}

      {!loading && materials.length > 0 && (
        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80">
              <tr className="text-[11px] text-slate-300">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">BOQ No</th>
                <th className="px-3 py-2 text-right">Unit</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">GST (5%)</th>
                <th className="px-3 py-2 text-right">Final Rate</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, idx) => (
                <tr
                  key={m.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >
                  <td className="px-3 py-2 align-top text-[11px] text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 align-top max-w-[260px]">
                    <div className="text-[11px] text-slate-100 line-clamp-3">
                      {m.description}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px]">
                    {m.boq_item_no || "-"}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[11px]">
                    {m.unit}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[11px]">
                    {m.quantity.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[11px]">
                    ₹{m.base_rate.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[11px]">
                    ₹{m.gst_rate.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[11px]">
                    ₹{m.final_rate.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[11px] font-semibold text-emerald-400">
                    ₹{m.total_amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[11px]">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                    {/* later we can add Edit button here */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <MaterialForm
          onClose={() => !saving && setShowForm(false)}
          onSubmit={handleAddMaterial}
        />
      )}
    </div>
  );
}
