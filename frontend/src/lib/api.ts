import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL - check your .env file");
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path: string, options: RequestInit = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (res.status === 204) return undefined;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String(body.detail)
        : null;
    throw new ApiError(
      res.status,
      detail ?? `Request failed with status ${res.status}`,
    );
  }

  return body;
}

export const apiGet = (path: string) => request(path, { method: "GET" });
export const apiPost = (path: string, data?: unknown) =>
  request(path, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
export const apiPut = (path: string, data?: unknown) =>
  request(path, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
export const apiPatch = (path: string, data?: unknown) =>
  request(path, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
export const apiDelete = (path: string) => request(path, { method: "DELETE" });
