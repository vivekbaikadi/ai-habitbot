
import apiClient from "./client";

// ─── Enums ─────────────────────────────────────────

export type PrimaryGoal =
  | "WEIGHT_LOSS"
  | "WEIGHT_MAINTENANCE"
  | "MUSCLE_GAIN"
  | "GENERAL_HEALTH";

export type Sex =
  | "MALE"
  | "FEMALE"
  | "OTHER"
  | "PREFER_NOT_TO_SAY";

export type DietType =
  | "VEGETARIAN"
  | "NON_VEGETARIAN"
  | "EGGETARIAN"
  | "VEGAN";

export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "VERY_ACTIVE"
  | "EXTRA_ACTIVE";

// ─── Onboarding ────────────────────────────────────

export interface OnboardingInput {
  primaryGoal: PrimaryGoal;
  activityLevel: ActivityLevel;
  dateOfBirth: string;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  dietType: DietType;
  dislikedFoodIds: string[];
}

export interface OnboardingUser {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
}

export async function completeOnboarding(
  input: OnboardingInput
): Promise<OnboardingUser> {
  const response = await apiClient.put<{
    success: boolean;
    data: {
      user: OnboardingUser;
      message: string;
    };
  }>("/profile/onboarding", input);

  return response.data.data.user;
}

// ─── Profile Types ─────────────────────────────────

export interface UserProfileDetails {
  id: string;
  userId: string;
  dateOfBirth: string | null;
  sex: Sex | null;
  heightCm: number | string | null;
  weightKg: number | string | null;
  activityLevel: ActivityLevel | null;
  primaryGoal: PrimaryGoal | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDietaryPreference {
  id: string;
  userId: string;
  dietType: DietType;
  createdAt: string;
  updatedAt: string;
}

export interface DislikedFood {
  id: string;
  userId: string;
  foodId: string;
  createdAt: string;
  food: {
    id: string;
    name: string;
    dietType: DietType;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profile: UserProfileDetails | null;
  dietaryPreference: UserDietaryPreference | null;
  foodDislikes: DislikedFood[];
}

// ─── Profile Update Input ──────────────────────────

export interface UpdateProfileInput {
  primaryGoal?: PrimaryGoal;
  activityLevel?: ActivityLevel;
  dateOfBirth?: string;
  sex?: Sex;
  heightCm?: number;
  weightKg?: number;
  dietType?: DietType;
  dislikedFoodIds?: string[];
}

// ─── Get User Profile ──────────────────────────────

export async function getUserProfile(): Promise<UserProfile> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      profile: UserProfile;
    };
  }>("/profile");

  return response.data.data.profile;
}

// ─── Update User Profile ───────────────────────────

export async function updateUserProfile(
  input: UpdateProfileInput
): Promise<UserProfile> {
  const response = await apiClient.put<{
    success: boolean;
    data: {
      profile: UserProfile;
      message: string;
    };
  }>("/profile", input);

  return response.data.data.profile;
}
