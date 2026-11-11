import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  clearAuth,
} from "../auth/storage";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;

let refreshPromise: Promise<string | null> | null =
  null;

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

async function refreshToken(): Promise<string | null> {
  const refreshTokenValue =
    getRefreshToken();

  if (!refreshTokenValue) {
    clearAuth();
    return null;
  }

  try {
    const response =
      await axios.post<{
        success: boolean;
        data: {
          accessToken: string;
          refreshToken: string;
        };
      }>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {
          refreshToken:
            refreshTokenValue,
        }
      );

    const {
      accessToken,
      refreshToken: newRefreshToken,
    } =
      response.data.data;

    updateAccessToken(accessToken);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "habitbot_refresh_token",
        newRefreshToken
      );
    }

    return accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as
        | (InternalAxiosRequestConfig & {
            _retry?: boolean;
          })
        | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    /*
     * Never attempt to refresh the refresh endpoint
     * itself.
     */
    if (
      originalRequest.url?.includes(
        "/auth/refresh"
      )
    ) {
      clearAuth();

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;

      refreshPromise = refreshToken()
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
    }

    const newAccessToken =
      await refreshPromise;

    if (!newAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization =
      `Bearer ${newAccessToken}`;

    return apiClient(
      originalRequest
    );
  }
);

export default apiClient;