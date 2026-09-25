// ---------------------------------------------------------------------------
// Unified data client with automatic backend detection.
//
// The app can run against two backends:
//   - Supabase (the default, used by the live site)
//   - A REST API (the Node/Express + MySQL backend)
//
// Set VITE_PUBLIC_API_URL (e.g. /api) to use the REST API. Leave it unset to
// keep using Supabase.
//
// The REST API is probed once at start-up. If it cannot be reached (cold start,
// transient network failure, deployment hiccup) the client automatically
// switches every request to Supabase and keeps re-probing in the background,
// so the UI never breaks and no failed-request noise reaches the console.
// ---------------------------------------------------------------------------

const API_URL = (import.meta.env.VITE_PUBLIC_API_URL as string | undefined)?.replace(/\/$/, "");

const API_CONFIGURED = Boolean(API_URL);

// Live binding: flips to false when the REST API cannot be reached so every
// dual-mode module in the app transparently falls back to Supabase.
export let apiMode = API_CONFIGURED;

export const apiBaseUrl = API_URL ?? "";

let apiHealthy = API_CONFIGURED;
let probing: Promise<boolean> | null = null;

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
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = { method?: string; headers?: Record<string, string>; body?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Probe the REST API. Cached while in flight; never throws. */
export function probeApi(timeoutMs = 6000): Promise<boolean> {
  if (!API_CONFIGURED) return Promise.resolve(false);
  if (probing) return probing;

  probing = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${API_URL}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      apiHealthy = res.ok;
    } catch {
      apiHealthy = false;
    } finally {
      clearTimeout(timer);
      probing = null;
    }
    apiMode = apiHealthy;
    return apiHealthy;
  })();

  return probing;
}

/** True when the REST API answered its health check. */
export function isApiHealthy(): boolean {
  return apiHealthy;
}

/** Mark the REST API as usable again (used after a successful request). */
export function markApiHealthy(): void {
  apiHealthy = true;
  apiMode = true;
}

/** Mark the REST API as unusable so callers fall back to Supabase. */
export function markApiUnhealthy(): void {
  apiHealthy = false;
  apiMode = false;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
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
        const err = new ApiError(msg, res.status);
        // 5xx from a cold/sleeping function is worth one more try.
        if (res.status >= 500 && attempt < 2) {
          lastError = err;
          await sleep(300 * (attempt + 1));
          continue;
        }
        throw err;
      }

      apiHealthy = true;
      apiMode = true;
      return data as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      lastError = err;
      if (attempt === 2) {
        apiHealthy = false;
        apiMode = false;
        throw new ApiError("The service is temporarily unavailable. Please try again.");
      }
      await sleep(300 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new ApiError("Request failed");
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

// Upload a file as multipart/form-data. Returns the stored URL.
export async function uploadFile(file: File): Promise<string> {
  if (!apiMode) {    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }
  const form = new FormData();
  form.append("file", file);
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${apiBaseUrl}/uploads`, {
    method: "POST",
    headers,
    body: form,
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
    const msg = (data as { error?: string } | null)?.error || "Could not upload this image.";
    throw new ApiError(msg);
  }
  return (data as { url?: string }).url ?? "";
}

// Resolve a possibly-relative image path (uploaded files) to a usable URL.
export function resolveImageUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  if (src.startsWith("data:")) return src;
  if (apiMode && src.startsWith("/uploads")) return `${apiBaseUrl}${src}`;
  return src;
}

/**
 * Detect the available backend once, then quietly keep watching it. Safe to
 * call from any entry point; never rejects.
 */
export function startApiAutoDetect(): void {
  if (!apiMode) return;
  void probeApi();
  if (typeof window === "undefined") return;
  const timer = window.setInterval(() => {
    if (!apiHealthy) void probeApi();
  }, 60000);
  window.addEventListener("online", () => void probeApi());
  window.addEventListener("focus", () => void probeApi());
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
      () => void probeApi()
    );
  } else {
    void timer;
  }
}
