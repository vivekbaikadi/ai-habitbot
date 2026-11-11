import type { AuthResponse } from "../api/auth";

const ACCESS_TOKEN_KEY = "habitbot_access_token";
const REFRESH_TOKEN_KEY = "habitbot_refresh_token";

export function saveAuth(
  auth: AuthResponse
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    auth.accessToken
  );

  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    auth.refreshToken
  );
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    ACCESS_TOKEN_KEY
  );
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    REFRESH_TOKEN_KEY
  );
}

export function updateAccessToken(
  accessToken: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken
  );
}

export function clearAuth(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );
}