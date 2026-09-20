import { apiClient } from "./client";

export interface Member {
  id: number;
  email: string;
  name: string;
  penName: string;
  role: string;
  createdAt: string;
}

interface AuthResponse {
  token: string;
  user: Member;
}

export const authApi = {
  signup: (data: { email: string; password: string; name: string; penName: string }) =>
    apiClient.post<AuthResponse>("/api/auth/signup", data).then((res) => res.data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>("/api/auth/login", data).then((res) => res.data),
  me: () => apiClient.get<{ user: Member }>("/api/members/me").then((res) => res.data.user),
  update: (data: { name: string; penName: string; currentPassword?: string; newPassword?: string }) =>
    apiClient.put<{ user: Member }>("/api/members/me", data).then((res) => res.data.user),
};
