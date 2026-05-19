const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// Token helpers (browser-only) — prefixed with admin_ to avoid conflicts
export const tokenStorage = {
  getAccess: () =>
    typeof window !== "undefined" ? localStorage.getItem("admin_accessToken") : null,
  getRefresh: () =>
    typeof window !== "undefined" ? localStorage.getItem("admin_refreshToken") : null,
  set: (access: string, refresh: string) => {
    localStorage.setItem("admin_accessToken", access);
    localStorage.setItem("admin_refreshToken", refresh);
  },
  clear: () => {
    localStorage.removeItem("admin_accessToken");
    localStorage.removeItem("admin_refreshToken");
  },
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: any;
  auth?: boolean;
};

let refreshingPromise: Promise<boolean> | null = null;

export async function apiRequest<T>(
  path: string,
  { body, auth = false, ...init }: RequestOptions = {}
): Promise<T> {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(init.headers as Record<string, string>),
  };

  const getHeaders = () => {
    if (auth) {
      const token = tokenStorage.getAccess();
      if (token) return { ...headers, Authorization: `Bearer ${token}` };
    }
    return headers;
  };

  const executeRequest = async () => {
    return fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: getHeaders(),
      ...(body !== undefined ? { body: isFormData ? body : JSON.stringify(body) } : {}),
    });
  };

  let res = await executeRequest();

  // Handle Unauthorized (401) — Attempt Refresh
  if (res.status === 401 && auth && !path.includes("/auth/refresh")) {
    if (!refreshingPromise) {
      refreshingPromise = (async () => {
        try {
          const refreshToken = tokenStorage.getRefresh();
          if (!refreshToken) return false;
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const json = await refreshRes.json();
            const data = json.data || json;
            tokenStorage.set(data.accessToken, data.refreshToken);
            return true;
          }
          return false;
        } catch {
          return false;
        } finally {
          refreshingPromise = null;
        }
      })();
    }
    const success = await refreshingPromise;
    if (success) {
      res = await executeRequest();
    } else {
      tokenStorage.clear();
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw Object.assign(new Error(data?.message ?? res.statusText), {
      status: res.status,
      data,
    });
  }

  return data as T;
}
