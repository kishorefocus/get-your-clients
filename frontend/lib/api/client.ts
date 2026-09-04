/**
 * Central fetch wrapper for the GlobalReach backend API.
 *
 * - Prepends NEXT_PUBLIC_API_URL to every request.
 * - Attaches Authorization: Bearer <access_token> from localStorage.
 * - On 401, refreshes tokens once and retries the original request.
 * - Throws ApiError on non-2xx responses.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.5:8001";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public path?: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
  };
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function doRefresh(): Promise<boolean> {
  const { refresh } = getTokens();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, body, headers: extraHeaders, ...rest } = options;

  const buildHeaders = (): HeadersInit => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      ...(extraHeaders as Record<string, string>),
    };
    if (!skipAuth) {
      const { access } = getTokens();
      if (access) h["Authorization"] = `Bearer ${access}`;
    }
    return h;
  };

  const makeRequest = () =>
    fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await makeRequest();

  // Auto-refresh once on 401
  if (res.status === 401 && !skipAuth) {
    const refreshed = await doRefresh();
    if (refreshed) {
      res = await makeRequest();
    }
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      detail = errJson.detail ?? detail;
    } catch {
      // leave as statusText
    }
    throw new ApiError(res.status, detail, path);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/** Multipart upload – don't set Content-Type, browser sets it with boundary. */
export async function apiFetchForm<T = unknown>(
  path: string,
  formData: FormData
): Promise<T> {
  const { access } = getTokens();
  const headers: Record<string, string> = {};
  if (access) headers["Authorization"] = `Bearer ${access}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      detail = errJson.detail ?? detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail, path);
  }

  return res.json() as Promise<T>;
}

/**
 * Build a WebSocket URL with the access token as a query param.
 * Browsers can't set Authorization headers on WS upgrade requests.
 */
export function buildWsUrl(path: string): string {
  const { access } = getTokens();
  const wsBase = BASE_URL.replace(/^http/, "ws");
  return `${wsBase}${path}${access ? `?token=${access}` : ""}`;
}
