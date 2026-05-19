"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authApi, userApi, tokenStorage } from "@/lib/api";
import type { AdminUser } from "@/lib/api";

interface AuthContextValue {
  user: AdminUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  setUser: (user: AdminUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }
    userApi
      .getMe()
      .then((res) => {
        const u = res.user;
        if (u) setUser(u);
        else throw new Error("No user data found in response");
      })
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        isAdmin: user?.role === "admin",
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
