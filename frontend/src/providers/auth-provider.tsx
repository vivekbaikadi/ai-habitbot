"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from "@/lib/api/auth";

import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  saveAuth,
} from "@/lib/auth/storage";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (
    input: LoginInput
  ) => Promise<AuthUser>;

  register: (
    input: RegisterInput
  ) => Promise<AuthUser>;

  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | null>(
    null
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    async function initializeAuth() {
      const token = getAccessToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, []);

  async function login(
    input: LoginInput
  ): Promise<AuthUser> {
    const auth = await loginUser(input);

    saveAuth(auth);
    setUser(auth.user);

    return auth.user;
  }

  async function register(
    input: RegisterInput
  ): Promise<AuthUser> {
    const auth = await registerUser(input);

    saveAuth(auth);
    setUser(auth.user);

    return auth.user;
  }

  async function logout() {
    const refreshToken =
      getRefreshToken();

    try {
      if (refreshToken) {
        await logoutUser(
          refreshToken
        );
      }
    } finally {
      clearAuth();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated:
          user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}