import axios from "axios";

// When real backend is ready, set VITE_API_URL in .env and remove mock stores
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE_URL = (import.meta as any).env?.VITE_API_URL || "";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  // The old mock store resolved in well under a second; the real backend adds
  // real network round-trips (and image uploads chain two of them), so this
  // needs more headroom than the original mock-era value.
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("wt_auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API Error]", err);
    // Surface the server's actual message through `.message` so existing
    // `error instanceof Error ? error.message : ...` call sites keep working
    // exactly as they did against the old store's thrown Error(message).
    // Mutated in place (not replaced) so `axios.isAxiosError(error)` call
    // sites (e.g. ProfilePage) still see a real AxiosError.
    const serverMessage = err?.response?.data?.message;
    if (typeof serverMessage === "string" && serverMessage && err instanceof Error) {
      err.message = serverMessage;
    }
    return Promise.reject(err);
  }
);
