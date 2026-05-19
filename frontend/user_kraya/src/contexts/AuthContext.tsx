"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { authApi, userApi, tokenStorage } from "@/lib/api";
import type { User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // On mount, try to restore session from stored token
  useEffect(() => {
    const token = tokenStorage.getAccess();

    if (!token) {
      setIsLoading(false);
      return;
    }

    userApi
      .getMe()
      .then((res) => {
        const u = res.data || res.user;
        if (u) setUser(u);
        else throw new Error("User not found in response");
      })
      .catch(() => {
        // Token expired / invalid — clear storage
        tokenStorage.clear();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoggedIn: !!user,
    isLoading,
    logout,
    setUser,
    showLogin,
    setShowLogin,
  }), [user, isLoading, logout, showLogin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
