import apiClient from "./client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(
  input: RegisterInput
): Promise<AuthResponse> {
  const response = await apiClient.post<{
    success: boolean;
    data: AuthResponse;
  }>("/auth/register", input);

  return response.data.data;
}

export async function loginUser(
  input: LoginInput
): Promise<AuthResponse> {
  const response = await apiClient.post<{
    success: boolean;
    data: AuthResponse;
  }>("/auth/login", input);

  return response.data.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      user: AuthUser;
    };
  }>("/auth/me");

  return response.data.data.user;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<AuthResponse> {
  const response = await apiClient.post<{
    success: boolean;
    data: AuthResponse;
  }>("/auth/refresh", {
    refreshToken,
  });

  return response.data.data;
}

export async function logoutUser(
  refreshToken: string
): Promise<void> {
  await apiClient.post("/auth/logout", {
    refreshToken,
  });
}