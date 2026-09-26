const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  async request(path, options = {}) {
    const { body, headers = {}, ...rest } = options;

    const res = await fetch(`${this.baseUrl}${path}`, {
      credentials: "include",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        "ngrok-skip-browser-warning": "1",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = { success: false, message: "Invalid response" };
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
      const err = new Error(data.message || `Request failed (${res.status})`);
      err.status = res.status;
      err.errors = data.errors;
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
