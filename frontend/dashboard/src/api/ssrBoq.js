const API_BASE = "http://127.0.0.1:8000";

export async function previewRate({ description, quantity }) {
  try {
    const res = await fetch(`${API_BASE}/ssr/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, quantity }),
    });

    // 404 → "rate not found" case
    if (res.status === 404) {
      return { notFound: true };
    }

    // any other non-OK → real server error
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Server error (${res.status})`);
    }

    // success
    const data = await res.json();
    return { notFound: false, data };
  } catch (err) {
    console.error("Error calling /ssr/rate:", err);
    // bubble up so the form can show a proper error message
    throw err;
  }
}
