"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  googleLogin as apiGoogleLogin,
  logout as apiLogout,
  me,
  LoginRequest,
  RegisterRequest,
  GoogleAuthRequest,
  GoogleAuthResponse,
  UserResponse,
} from "@/lib/api/auth";
import { getTokens } from "@/lib/api/client";

interface AuthState {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  loginWithGoogle: (payload: GoogleAuthRequest) => Promise<GoogleAuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, rehydrate user from stored token
  useEffect(() => {
    const { access } = getTokens();
    if (!access) {
      setIsLoading(false);
      return;
    }
    me()
      .then(setUser)
      .catch(() => {
        // Token invalid / expired and refresh failed — clear state
        apiLogout();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    await apiLogin(payload);
    const userData = await me();
    setUser(userData);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    await apiRegister(payload);
    const userData = await me();
    setUser(userData);
  }, []);

  const loginWithGoogle = useCallback(async (payload: GoogleAuthRequest) => {
    const res = await apiGoogleLogin(payload);
    const userData = await me();
    setUser(userData);
    return res;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
