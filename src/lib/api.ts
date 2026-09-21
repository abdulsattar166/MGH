// ---------------------------------------------------------------------------
// Unified data client.
//
// This project can run against two backends:
//   - Supabase (the default, used by the live site)
//   - A REST API (the local Node/Express + MySQL backend)
//
// Set VITE_PUBLIC_API_URL (e.g. http://localhost:4000/api) in the frontend's
// .env to switch to the REST API. Leave it unset to keep using Supabase.
// ---------------------------------------------------------------------------

const API_URL = (import.meta.env.VITE_PUBLIC_API_URL as string | undefined)?.replace(/\/$/, "");

export const apiMode = Boolean(API_URL);

const TOKEN_KEY = "mubarak_api_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = { method?: string; headers?: Record<string, string>; body?: string };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error || "Request failed";
    throw new ApiError(msg);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};