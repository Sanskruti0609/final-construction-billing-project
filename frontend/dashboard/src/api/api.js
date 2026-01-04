//const API_BASE = "http://127.0.0.1:8000"; // FastAPI
const API_BASE = window.location.protocol === "https:"
  ? "https://127.0.0.1:8000"
  : "http://127.0.0.1:8000";


export async function fetchMaterials() {
  const res = await fetch(`${API_BASE}/materials/`);
  if (!res.ok) throw new Error("Failed to load materials");
  return res.json();
}

export async function createMaterial(payload) {
  const res = await fetch(`${API_BASE}/materials/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create material");
  return res.json();
}

export async function updateMaterial(id, payload) {
  const res = await fetch(`${API_BASE}/materials/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update material");
  return res.json();
}

export async function deleteMaterial(id) {
  const res = await fetch(`${API_BASE}/materials/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete material");
  return res.json();
}

export async function createInvoice(payload) {
  const res = await fetch(`${API_BASE}/invoices/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create invoice");
  return res.json();
}

export async function downloadInvoicePdf(invoiceId) {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/pdf`, {
    method: "GET",
  });
  if (!res.ok) throw new Error("Failed to download invoice");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice_${invoiceId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
