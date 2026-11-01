const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response.");
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status}).`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }

  return data;
}

export function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function formatPublishedDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}
