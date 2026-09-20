import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, type Member } from "../api/auth";

interface AuthContextValue {
  user: Member | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string; penName: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: { name: string; penName: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "wt_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    authApi.me().then(setUser).catch(() => localStorage.removeItem(TOKEN_KEY)).finally(() => setLoading(false));
  }, []);

  const storeAuth = (result: { token: string; user: Member }) => {
    localStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login: async (email, password) => storeAuth(await authApi.login({ email, password })),
      signup: async (data) => storeAuth(await authApi.signup(data)),
      logout: () => { localStorage.removeItem(TOKEN_KEY); setUser(null); },
      updateUser: async (data) => setUser(await authApi.update(data)),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
