import axios from "axios";

// When real backend is ready, set VITE_API_URL in .env and remove mock stores
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE_URL = (import.meta as any).env?.VITE_API_URL || "";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API Error]", err);
    return Promise.reject(err);
  }
);
