// src/api/materials.js

const API_BASE = "http://127.0.0.1:8000"; // or "http://localhost:8000"

// ---------- BASIC MATERIALS CRUD ----------

export async function getMaterials() {
  const res = await fetch(`${API_BASE}/materials/`);
  if (!res.ok) {
    throw new Error("Failed to load materials");
  }
  return res.json();
}

export async function createMaterial(payload) {
  const res = await fetch(`${API_BASE}/materials/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to create material");
  }

  return res.json();
}

export async function deleteMaterial(id) {
  const res = await fetch(`${API_BASE}/materials/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to delete material");
  }

  return res.json();
}

// ---------- FULL MATERIALS BILL DOWNLOAD (ALL ITEMS) ----------

export function downloadMaterialsBillPdf() {
  // backend uses GET /materials/bill/pdf
  const url = `${API_BASE}/materials/bill/pdf`;
  window.open(url, "_blank");
}

export function downloadMaterialsBillExcel() {
  // backend uses GET /materials/bill/excel
  const url = `${API_BASE}/materials/bill/excel`;
  window.open(url, "_blank");
}

// ---------- SINGLE MATERIAL MEASUREMENT SHEET (INDIVIDUAL ITEM) ----------

export async function downloadSingleMaterialBillPdf(payload) {
  const res = await fetch(`${API_BASE}/materials/single-bill/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to download material PDF");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "material_measurement_sheet.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadSingleMaterialBillExcel(payload) {
  const res = await fetch(`${API_BASE}/materials/single-bill/excel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error downloading Excel: ${res.status} ${text}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "single_material_bill.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}