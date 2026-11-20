
import apiClient from "./client";

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

export interface OnboardingInput {
  primaryGoal: PrimaryGoal;
  activityLevel: ActivityLevel;
  dateOfBirth?: string;
  sex?: Sex;
  heightCm?: number;
  weightKg?: number;
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

