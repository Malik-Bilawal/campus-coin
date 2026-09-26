const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Users should never see raw transport/infra text ("Invalid response",
// "Failed to fetch", stack-ish 500s). Server-written 4xx messages are kept.
function friendlyHttpError(status, data) {
  const raw = typeof data?.message === "string" ? data.message.trim() : "";
  if (status === 429) return "You're doing that a lot — wait a minute and try again.";
  if (status >= 500) return "Something went wrong on our side — please try again in a bit.";
  if (raw.startsWith("Route not found")) return "That request didn't go through — please try again.";
  if (raw === "Validation failed" || raw === "Invalid response" || !raw) {
    return "Please check your input and try again.";
  }
  if (status === 401) return raw;
  return raw;
}

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  async request(path, options = {}) {
    const { body, headers = {}, ...rest } = options;

    let res;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        credentials: "include",
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          "ngrok-skip-browser-warning": "1",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...rest,
      });
    } catch {
      const e = new Error(
        "Couldn't reach Campus Coin — check your internet connection and try again."
      );
      e.status = 0;
      throw e;
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.status === 401 && !path.includes("/auth/")) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request(path, options);
      }
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    if (!res.ok) {
      const err = new Error(friendlyHttpError(res.status, data));
      err.status = res.status;
      err.errors = data?.errors;
      throw err;
    }

    if (!data || typeof data !== "object") {
      const err = new Error("The server sent an unexpected response — please try again.");
      err.status = res.status;
      throw err;
    }

    return data;
  }

  async tryRefresh() {
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "ngrok-skip-browser-warning": "1" },
      });
      if (!res.ok) return false;
      try {
        const data = await res.json();
        const tok = data?.data?.accessToken;
        if (tok && typeof window !== "undefined") {
          sessionStorage.setItem("accessToken", tok);
        }
      } catch {
        /* ignore body parse */
      }
      return true;
    } catch {
      return false;
    }
  }

  get(path, options) {
    return this.request(path, { ...options, method: "GET" });
  }
  post(path, body, options) {
    return this.request(path, { ...options, method: "POST", body });
  }
  patch(path, body, options) {
    return this.request(path, { ...options, method: "PATCH", body });
  }
  put(path, body, options) {
    return this.request(path, { ...options, method: "PUT", body });
  }
  delete(path, options) {
    return this.request(path, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();
export { API_URL };
