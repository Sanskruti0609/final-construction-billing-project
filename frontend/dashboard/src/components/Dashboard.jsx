import React, { useEffect, useState } from "react";
import {
  fetchMaterials,
  createMaterial,
  deleteMaterial,
  createInvoice,
  downloadInvoicePdf,
} from "../api";

export default function Dashboard() {
  const [materials, setMaterials] = useState([]);
  const [newMat, setNewMat] = useState({ name: "", unit: "", quantity: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      const data = await fetchMaterials();
      setMaterials(data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load materials");
    }
  }

  async function handleAddMaterial(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const created = await createMaterial(newMat);
      setMaterials((prev) => [...prev, created]);
      setNewMat({ name: "", unit: "", quantity: 0 });
      setMessage("Material added & rate fetched from SSR.");
    } catch (err) {
      console.error(err);
      setMessage("Error creating material.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteMaterial(id) {
    if (!confirm("Delete this material?")) return;
    try {
      await deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setMessage("Error deleting material.");
    }
  }

  async function handleGenerateInvoice(type) {
    // Simple demo invoice: all materials with qty 1
    try {
      const invoice = await createInvoice({
        client_name: "Demo Client",
        site_name: "Demo Site",
        invoice_type: type,
        items: materials.map((m) => ({ material_id: m.id, quantity: 1 })),
      });
      await downloadInvoicePdf(invoice.id);
      setMessage(`Invoice #${invoice.id} downloaded.`);
    } catch (err) {
      console.error(err);
      setMessage("Error generating/downloading invoice.");
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      {message && (
        <div className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm">
          {message}
        </div>
      )}

      {/* Top stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Materials" value={materials.length} />
        <StatCard
          label="Total Estimated Cost"
          value={
            "₹" +
            materials
              .reduce((sum, m) => sum + m.rate * (m.quantity || 0), 0)
              .toFixed(2)
          }
        />
        <StatCard label="Pending Invoices" value="3 (demo)" />
      </div>

      {/* Three main panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Generate Invoice */}
        <SectionCard title="Generate Invoice">
          <p className="text-sm mb-4 text-slate-300">
            Quickly generate an invoice from current materials.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleGenerateInvoice("general")}
              className="w-full rounded-lg px-3 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Download General Invoice
            </button>
            <button
              onClick={() => handleGenerateInvoice("materials")}
              className="w-full rounded-lg px-3 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white"
            >
              Download Materials Bill
            </button>
            <button
              onClick={() => handleGenerateInvoice("ssr_boq")}
              className="w-full rounded-lg px-3 py-2 text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white"
            >
              Download SSR & BOQ Bill
            </button>
          </div>
        </SectionCard>

        {/* 2. Manage Materials */}
        <SectionCard title="Manage Materials">
          <form onSubmit={handleAddMaterial} className="space-y-3 mb-4">
            <div className="grid grid-cols-3 gap-2">
              <input
                className="col-span-2 rounded-md bg-slate-900/60 border border-slate-700 px-2 py-1 text-sm"
                placeholder="Material name"
                value={newMat.name}
                onChange={(e) =>
                  setNewMat((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
              <input
                className="rounded-md bg-slate-900/60 border border-slate-700 px-2 py-1 text-sm"
                placeholder="Unit (cum, m, kg...)"
                value={newMat.unit}
                onChange={(e) =>
                  setNewMat((p) => ({ ...p, unit: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                step="0.01"
                className="w-24 rounded-md bg-slate-900/60 border border-slate-700 px-2 py-1 text-sm"
                placeholder="Qty"
                value={newMat.quantity}
                onChange={(e) =>
                  setNewMat((p) => ({
                    ...p,
                    quantity: parseFloat(e.target.value || 0),
                  }))
                }
              />
              <button
                disabled={loading}
                className="flex-1 rounded-lg px-3 py-1.5 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Material"}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Rate will be auto-fetched from SSR/BOQ Excel sheets.
            </p>
          </form>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80 text-xs">
            {materials.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-slate-400">
                    {m.unit} · Qty {m.quantity} · Rate ₹{m.rate.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMaterial(m.id)}
                  className="text-red-400 hover:text-red-300 text-[11px]"
                >
                  Delete
                </button>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="py-4 text-center text-slate-500 text-xs">
                No materials yet.
              </div>
            )}
          </div>
        </SectionCard>

        {/* 3. SSR & BOQ Mapping info */}
        <SectionCard title="SSR & BOQ Overview">
          <p className="text-sm text-slate-300 mb-3">
            This panel can later show:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
            <li>SSR item & rate for each material</li>
            <li>Pie chart of cost distribution (piles, PCC, RCC etc.)</li>
            <li>Recent invoices with amounts</li>
          </ul>
          <p className="text-xs mt-4 text-slate-500">
            We can plug Recharts/Chart.js here later for bar graphs & pie
            charts once your data is flowing correctly.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/40">
      <h2 className="text-sm font-semibold mb-3 tracking-wide text-slate-100">
        {title}
      </h2>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-1 shadow-lg shadow-black/40">
      <span className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
