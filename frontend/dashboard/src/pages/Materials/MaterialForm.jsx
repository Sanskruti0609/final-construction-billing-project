// src/pages/Materials/MaterialForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { previewRate } from "../../api/ssrBoq";
import {
  downloadSingleMaterialBillPdf,
  downloadSingleMaterialBillExcel,
} from "../../api/materials";

const emptyRow = {
  pileDescription: "",
  no: "",
  length: "",
  breadth: "",
  depth: "",
  quantity: 0,
};

export default function MaterialForm({ onClose, onSubmit }) {
  const [description, setDescription] = useState("");

  const [rows, setRows] = useState([{ ...emptyRow }]);

  const [rateInfo, setRateInfo] = useState(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateError, setRateError] = useState("");

  // NON SSR flag (from backend or derived)
  const [isNonSSR, setIsNonSSR] = useState(false);

  // manual inputs for NON SSR
  const [manualUnit, setManualUnit] = useState("");
  const [manualBaseRate, setManualBaseRate] = useState("");

  // ---- derived total quantity from all rows ----
  const totalQuantity = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0),
    [rows]
  );

  // derived values for NON SSR preview (based on totalQuantity)
  const manualBase = parseFloat(manualBaseRate) || 0;
  const manualGst = +(manualBase * 0.05).toFixed(2);
  const manualFinalRate = +(manualBase + manualGst).toFixed(2);
  const manualTotal = +(manualFinalRate * (totalQuantity || 0)).toFixed(2);

  // ---- update a field in a row and recompute its quantity ----
  function updateRowField(index, field, value) {
    const updated = [...rows];
    const row = { ...updated[index], [field]: value };

    const no = Number(row.no) || 0;
    const L = Number(row.length) || 0;
    const B = Number(row.breadth) || 0;
    const D = Number(row.depth) || 0;

    row.quantity = no * L * B * D;

    updated[index] = row;
    setRows(updated);
  }

  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }

  function removeRow(index) {
    setRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  // ---- SSR / BOQ Rate fetch based on description + TOTAL quantity ----
  useEffect(() => {
    async function fetchRate() {
      const desc = description.trim();
      if (!desc || totalQuantity <= 0) {
        setRateInfo(null);
        setRateError("");
        setIsNonSSR(false);
        return;
      }

      setLoadingRate(true);
      setRateError("");
      setRateInfo(null);

      try {
        // Call API with correct payload
        const apiRes = await previewRate({
          description: desc,
          quantity: totalQuantity,
        });

        // Support both shapes: { ... } OR { data, notFound }
        let resData = null;

        if (!apiRes) {
          resData = null;
        } else if (
          typeof apiRes === "object" &&
          apiRes !== null &&
          Object.prototype.hasOwnProperty.call(apiRes, "data")
        ) {
          // wrapper style: { data: {...}, notFound?: boolean }
          if (apiRes.notFound) {
            resData = null;
          } else {
            resData = apiRes.data || null;
          }
        } else {
          // raw backend JSON
          resData = apiRes;
        }

        if (!resData) {
          setRateError(
            "Rate not found in SSR / BOQ for this description. Please check the text."
          );
          setRateInfo(null);
          setIsNonSSR(false);
          return;
        }

        setRateInfo(resData);

        const non =
          !!resData.non_ssr || resData.ssr_item_no === "NON SSR ITEM";

        setIsNonSSR(non);

        if (non) {
          // clear manual inputs when switching into NON SSR mode
          setManualUnit("");
          setManualBaseRate("");
        }
      } catch (err) {
        console.error("Error fetching SSR/BOQ rate:", err);
        setRateError(
          err?.response?.data?.detail ||
            err?.message ||
            "Server error while fetching rate."
        );
        setRateInfo(null);
        setIsNonSSR(false);
      } finally {
        setLoadingRate(false);
      }
    }

    fetchRate();
  }, [description, totalQuantity]);

  // ---- Save: send simple payload (description + totalQuantity) to parent ----
    // ---- Save: send full material to parent (SSR vs NON SSR) ----
  function handleSave() {
  if (!description.trim()) {
    alert("Please enter SSR / BOQ description.");
    return;
  }
  if (totalQuantity <= 0) {
    alert("Total quantity must be greater than zero.");
    return;
  }
  if (!rateInfo) {
    alert("Rate information not available. Please wait.");
    return;
  }

  // ---------- NON SSR ----------
  if (isNonSSR) {
    if (!manualUnit.trim()) {
      alert("For NON SSR ITEM, please enter Unit.");
      return;
    }
    if (!manualBase || manualBase <= 0) {
      alert("For NON SSR ITEM, please enter valid Base Rate.");
      return;
    }

    onSubmit({
      description,
      ssr_item_no: "NON SSR ITEM",
      boq_item_no: rateInfo.boq_item_no || "-",
      unit: manualUnit.trim(),
      quantity: totalQuantity,
      base_rate: manualBase,
      gst_rate: manualGst,
      final_rate: manualFinalRate,
      total_amount: manualTotal,
      is_non_ssr: true,
    });

    return;
  }

  // ---------- SSR ITEM ----------
  onSubmit({
    description,
    ssr_item_no: rateInfo.ssr_item_no,
    boq_item_no: rateInfo.boq_item_no || "-",
    unit: rateInfo.unit,
    quantity: totalQuantity,
    base_rate: rateInfo.base_rate,
    gst_rate: rateInfo.gst_rate,
    final_rate: rateInfo.final_rate,
    total_amount: rateInfo.total_amount,
    is_non_ssr: false,
  });
}

  // ---- Build payload for single-bill PDF/Excel ----
  function buildSingleBillPayload() {
    if (!description.trim()) {
      alert("Please enter SSR / BOQ description first.");
      return null;
    }
    if (totalQuantity <= 0) {
      alert("Please fill No / L / B / D so quantity is > 0.");
      return null;
    }

    return {
      description,
      entries: rows.map((r) => ({
        pile_description: r.pileDescription || "",
        no_of_items: r.no ? Number(r.no) : null,
        length: r.length ? Number(r.length) : null,
        breadth: r.breadth ? Number(r.breadth) : null,
        depth: r.depth ? Number(r.depth) : null,
        quantity: r.quantity || null,
      })),
    };
  }

  async function handleDownloadMaterialPdf() {
    const payload = buildSingleBillPayload();
    if (!payload) return;

    try {
      await downloadSingleMaterialBillPdf(payload);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to download material PDF.");
    }
  }

  async function handleDownloadMaterialExcel() {
    const payload = buildSingleBillPayload();
    if (!payload) return;

    try {
      await downloadSingleMaterialBillExcel(payload);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to download material Excel.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[900px] max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-slate-100">
          Add Material (SSR / NON SSR + Measurement Sheet)
        </h3>

        {/* SSR / BOQ Description */}
        <label className="block text-xs text-slate-300 mb-1">
          Description (paste exact from SSR / BOQ)
        </label>
        <textarea
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-100"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Paste the item description here exactly as in SSR / BOQ..."
        />

        {/* Measurement rows table */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-200 font-semibold">
              Measurement Entries (No × L × B × D = Quantity)
            </span>
            <button
              type="button"
              onClick={addRow}
              className="px-3 py-1 rounded-lg text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-100"
            >
              + Add Row
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900">
            <table className="min-w-full text-[11px] text-slate-100">
              <thead className="bg-slate-800/80">
                <tr>
                  <th className="px-2 py-2 text-left w-10">Sr</th>
                  <th className="px-2 py-2 text-left w-[220px]">
                    Pile Description
                  </th>
                  <th className="px-2 py-2 text-center w-16">No</th>
                  <th className="px-2 py-2 text-center w-20">L</th>
                  <th className="px-2 py-2 text-center w-20">B</th>
                  <th className="px-2 py-2 text-center w-20">D</th>
                  <th className="px-2 py-2 text-center w-28">Quantity</th>
                  <th className="px-2 py-2 text-center w-14">Del</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      idx % 2 === 0 ? "bg-slate-900" : "bg-slate-900/60"
                    }
                  >
                    <td className="px-2 py-2">{idx + 1}</td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1"
                        value={row.pileDescription}
                        onChange={(e) =>
                          updateRowField(
                            idx,
                            "pileDescription",
                            e.target.value
                          )
                        }
                        placeholder="Pile / location note"
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <input
                        type="number"
                        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-center"
                        value={row.no}
                        onChange={(e) =>
                          updateRowField(idx, "no", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-center"
                        value={row.length}
                        onChange={(e) =>
                          updateRowField(idx, "length", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-center"
                        value={row.breadth}
                        onChange={(e) =>
                          updateRowField(idx, "breadth", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-center"
                        value={row.depth}
                        onChange={(e) =>
                          updateRowField(idx, "depth", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <div className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-right">
                        {Number(row.quantity || 0).toFixed(3)}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-400 hover:text-red-300 text-xs"
                        disabled={rows.length === 1}
                        title={
                          rows.length === 1
                            ? "At least one row is required"
                            : "Delete this row"
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total quantity display */}
          <div className="mt-2 text-right text-xs text-slate-200">
            Total Quantity:{" "}
            <span className="font-semibold text-emerald-400">
              {totalQuantity.toFixed(3)}
            </span>
          </div>
        </div>

        {/* SSR / NON SSR Rate preview */}
        <div className="mt-4 rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-3 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-300">
              {isNonSSR
                ? "NON SSR Rate Entry (manual)"
                : "Rate from SSR (for total qty):"}
            </span>
            {loadingRate && (
              <span className="text-slate-400 text-[11px]">Checking…</span>
            )}
          </div>

          {rateError && (
            <div className="text-red-400 text-[11px] whitespace-pre-line">
              {rateError}
            </div>
          )}

          {/* Show SSR / BOQ meta always when we have rateInfo */}
          {rateInfo && !rateError && (
            <div className="space-y-1 text-slate-200 mb-2">
              <div className="flex justify-between">
                <span>SSR Type</span>
                <span className="font-semibold">
                  {isNonSSR ? "NON SSR ITEM" : rateInfo.ssr_item_no || "-"}
                </span>
              </div>
              {rateInfo.boq_item_no && (
                <div className="flex justify-between">
                  <span>BOQ Item No</span>
                  <span>{rateInfo.boq_item_no}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>SSR Unit (if any)</span>
                <span>{rateInfo.unit || "-"}</span>
              </div>
            </div>
          )}

          {/* NON SSR → manual inputs */}
          {rateInfo && isNonSSR && !rateError && (
            <div className="space-y-2 text-slate-200 text-[11px]">
              <div>
                <label className="block text-[10px] text-slate-300 mb-1">
                  Unit (enter manually)
                </label>
                <input
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-slate-100"
                  value={manualUnit}
                  onChange={(e) => setManualUnit(e.target.value)}
                  placeholder="e.g. cum, sqm, MT, Running m"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-300 mb-1">
                  Base Rate (per Unit)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-slate-100"
                  value={manualBaseRate}
                  onChange={(e) => setManualBaseRate(e.target.value)}
                  placeholder="e.g. 1450.00"
                />
              </div>

              <div className="flex justify-between">
                <span>GST @ 5%</span>
                <span>₹{manualGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-400">
                <span>Final Rate (incl. GST)</span>
                <span>₹{manualFinalRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700 mt-1 text-sky-400 font-semibold">
                <span>Total for Qty {totalQuantity.toFixed(3)}</span>
                <span>₹{manualTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* SSR item → read-only SSR-based rates */}
          {rateInfo && !isNonSSR && !rateError && (
            <div className="space-y-1 text-slate-200 text-[11px]">
              <div className="flex justify-between">
                <span>Base Rate (SSR)</span>
                <span>
                  ₹{Number(rateInfo.base_rate || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST @ 5%</span>
                <span>
                  ₹{Number(rateInfo.gst_rate || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-400">
                <span>Final Rate (incl. GST)</span>
                <span>
                  ₹{Number(rateInfo.final_rate || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700 mt-1 text-sky-400 font-semibold">
                <span>Total for Qty {totalQuantity.toFixed(3)}</span>
                <span>
                  ₹{Number(rateInfo.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {!rateInfo && !rateError && !loadingRate && (
            <div className="text-slate-500 text-[11px]">
              Enter description and measurement rows to fetch SSR / BOQ rate.
              For NON SSR items, Unit and Base Rate can be entered manually.
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs bg-slate-700 hover:bg-slate-600"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownloadMaterialExcel}
            className="px-4 py-2 rounded-lg text-xs bg-amber-500 hover:bg-amber-600 text-white"
          >
            Download Material Excel
          </button>

          <button
            type="button"
            onClick={handleDownloadMaterialPdf}
            className="px-4 py-2 rounded-lg text-xs bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            Download Material PDF
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Save Material
          </button>
        </div>
      </div>
    </div>
  );
}
