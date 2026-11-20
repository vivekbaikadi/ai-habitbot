
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
