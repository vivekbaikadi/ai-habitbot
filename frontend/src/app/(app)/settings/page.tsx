
"use client";

import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UserRound,
  Target,
  Utensils,
  Save,
  Loader2,
  Search,
  X,
  Check,
} from "lucide-react";

import {
  getUserProfile,
  updateUserProfile,
  type UserProfile,
  type UpdateProfileInput,
  type PrimaryGoal,
  type Sex,
  type DietType,
  type ActivityLevel,
} from "@/lib/api/profile";

import {
  searchFoods,
  type Food,
} from "@/lib/api/foods";

interface ProfileFormState {
  dateOfBirth: string;
  sex: Sex;
  heightCm: string;
  weightKg: string;
  primaryGoal: PrimaryGoal;
  activityLevel: ActivityLevel;
  dietType: DietType;
}

const initialForm: ProfileFormState = {
  dateOfBirth: "",
  sex: "PREFER_NOT_TO_SAY",
  heightCm: "",
  weightKg: "",
  primaryGoal: "GENERAL_HEALTH",
  activityLevel: "MODERATE",
  dietType: "VEGETARIAN",
};

const inputClass =
  "w-full rounded-xl border border-[#e5e0d6] bg-white px-4 py-3 text-sm text-[#292820] outline-none transition placeholder:text-[#aaa69c] focus:border-[#f4773c] focus:ring-2 focus:ring-[#f4773c]/15";

const labelClass =
  "mb-2 block text-sm font-medium text-[#45443d]";

const primaryGoalOptions: {
  value: PrimaryGoal;
  label: string;
}[] = [
  { value: "WEIGHT_LOSS", label: "Weight loss" },
  { value: "WEIGHT_MAINTENANCE", label: "Weight maintenance" },
  { value: "MUSCLE_GAIN", label: "Muscle gain" },
  { value: "GENERAL_HEALTH", label: "General health" },
];

const activityOptions: {
  value: ActivityLevel;
  label: string;
}[] = [
  { value: "SEDENTARY", label: "Sedentary" },
  { value: "LIGHT", label: "Lightly active" },
  { value: "MODERATE", label: "Moderately active" },
  { value: "VERY_ACTIVE", label: "Very active" },
  { value: "EXTRA_ACTIVE", label: "Extra active" },
];

const dietOptions: {
  value: DietType;
  label: string;
  description: string;
}[] = [
  {
    value: "VEGETARIAN",
    label: "Vegetarian",
    description: "Plant-based foods and dairy",
  },
  {
    value: "NON_VEGETARIAN",
    label: "Non-vegetarian",
    description: "Includes meat and fish",
  },
  {
    value: "EGGETARIAN",
    label: "Eggetarian",
    description: "Vegetarian foods and eggs",
  },
  {
    value: "VEGAN",
    label: "Vegan",
    description: "Excludes all animal products",
  },
];

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4773c]/10 text-[#f4773c]">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#292820]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-5 text-[#77756f]">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const [form, setForm] =
    useState<ProfileFormState>(initialForm);

  const [foodSearch, setFoodSearch] = useState("");

  const [selectedFoods, setSelectedFoods] = useState<
    { id: string; name: string }[]
  >([]);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getUserProfile,
  });

  // Populate the form when the profile is retrieved.
  useEffect(() => {
    const userProfile = profileQuery.data;

    if (!userProfile?.profile) return;

    setForm({
      dateOfBirth:
        userProfile.profile.dateOfBirth?.slice(0, 10) ?? "",
      sex: userProfile.profile.sex ?? "PREFER_NOT_TO_SAY",
      heightCm: userProfile.profile.heightCm?.toString() ?? "",
      weightKg: userProfile.profile.weightKg?.toString() ?? "",
      primaryGoal:
        userProfile.profile.primaryGoal ?? "GENERAL_HEALTH",
      activityLevel:
        userProfile.profile.activityLevel ?? "MODERATE",
      dietType:
        userProfile.dietaryPreference?.dietType ?? "VEGETARIAN",
    });

    setSelectedFoods(
      userProfile.foodDislikes.map((item) => ({
        id: item.food.id,
        name: item.food.name,
      }))
    );
  }, [profileQuery.data]);

  // Search existing foods for the disliked-food selector.
  const foodsQuery = useQuery({
    queryKey: ["foods", "profile-search", foodSearch],
    queryFn: () =>
      searchFoods({
        search: foodSearch.trim(),
        page: 1,
        limit: 15,
      }),
    enabled: foodSearch.trim().length >= 2,
  });

  const updateMutation = useMutation({
    mutationFn: updateUserProfile,

    onSuccess: async (updatedProfile) => {
      queryClient.setQueryData<UserProfile>(
        ["profile"],
        updatedProfile
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["nutrition"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);

      toast.success("Profile updated successfully");
      setFoodSearch("");
    },

    onError: () => {
      toast.error(
        "Couldn't update your profile. Please try again."
      );
    },
  });

  function updateField<K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function addFood(food: Food) {
    setSelectedFoods((previous) => {
      if (previous.some((item) => item.id === food.id)) {
        return previous;
      }

      return [
        ...previous,
        {
          id: food.id,
          name: food.name,
        },
      ];
    });

    setFoodSearch("");
  }

  function removeFood(foodId: string) {
    setSelectedFoods((previous) =>
      previous.filter((food) => food.id !== foodId)
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const height = Number(form.heightCm);
    const weight = Number(form.weightKg);

    if (!Number.isFinite(height) || height < 50 || height > 300) {
      toast.error("Enter a valid height between 50 and 300 cm.");
      return;
    }

    if (!Number.isFinite(weight) || weight < 2 || weight > 500) {
      toast.error("Enter a valid weight between 2 and 500 kg.");
      return;
    }

    const input: UpdateProfileInput = {
      dateOfBirth: form.dateOfBirth,
      sex: form.sex,
      heightCm: height,
      weightKg: weight,
      primaryGoal: form.primaryGoal,
      activityLevel: form.activityLevel,
      dietType: form.dietType,
      dislikedFoodIds: selectedFoods.map((food) => food.id),
    };

    updateMutation.mutate(input);
  }

  const searchedFoods = foodsQuery.data?.foods ?? [];

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#77756f]">
          <Loader2 className="h-5 w-5 animate-spin text-[#f4773c]" />
          Loading your profile...
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">
          Couldn't load your profile.
        </p>

        <button
          type="button"
          onClick={() => profileQuery.refetch()}
          className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!profileQuery.data.profile) {
    return (
      <div className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-6">
        <p className="font-medium text-[#292820]">
          Profile information is unavailable.
        </p>
        <p className="mt-1 text-sm text-[#77756f]">
          Please complete your onboarding before editing your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-10">
      {/* Page header */}
      <header>
        <p className="mb-2 text-sm font-medium text-[#a16c4d]">
          YOUR ACCOUNT
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-[#292820] sm:text-4xl">
          Profile Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77756f]">
          Manage your personal information, fitness goals and
          dietary preferences to keep your HabitBot experience
          personalized.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal information */}
        <section className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-5 sm:p-7">
          <SectionHeader
            icon={UserRound}
            title="Personal Information"
            description="Keep your basic information up to date."
          />

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="dateOfBirth" className={labelClass}>
                Date of birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                value={form.dateOfBirth}
                onChange={(event) =>
                  updateField("dateOfBirth", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="sex" className={labelClass}>
                Sex
              </label>
              <select
                id="sex"
                value={form.sex}
                onChange={(event) =>
                  updateField("sex", event.target.value as Sex)
                }
                className={inputClass}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">
                  Prefer not to say
                </option>
              </select>
            </div>

            <div>
              <label htmlFor="heightCm" className={labelClass}>
                Height (cm)
              </label>
              <input
                id="heightCm"
                type="number"
                min="50"
                max="300"
                step="0.1"
                required
                value={form.heightCm}
                onChange={(event) =>
                  updateField("heightCm", event.target.value)
                }
                className={inputClass}
                placeholder="e.g. 175"
              />
            </div>

            <div>
              <label htmlFor="weightKg" className={labelClass}>
                Weight (kg)
              </label>
              <input
                id="weightKg"
                type="number"
                min="2"
                max="500"
                step="0.1"
                required
                value={form.weightKg}
                onChange={(event) =>
                  updateField("weightKg", event.target.value)
                }
                className={inputClass}
                placeholder="e.g. 70"
              />
            </div>
          </div>
        </section>

        {/* Fitness preferences */}
        <section className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-5 sm:p-7">
          <SectionHeader
            icon={Target}
            title="Fitness Preferences"
            description="Your goals and daily activity help calculate personalized nutrition targets."
          />

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="primaryGoal" className={labelClass}>
                Primary goal
              </label>
              <select
                id="primaryGoal"
                value={form.primaryGoal}
                onChange={(event) =>
                  updateField(
                    "primaryGoal",
                    event.target.value as PrimaryGoal
                  )
                }
                className={inputClass}
              >
                {primaryGoalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="activityLevel" className={labelClass}>
                Activity level
              </label>
              <select
                id="activityLevel"
                value={form.activityLevel}
                onChange={(event) =>
                  updateField(
                    "activityLevel",
                    event.target.value as ActivityLevel
                  )
                }
                className={inputClass}
              >
                {activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Dietary preferences */}
        <section className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-5 sm:p-7">
          <SectionHeader
            icon={Utensils}
            title="Dietary Preferences"
            description="Tell HabitBot about your food preferences."
          />

          <div className="mt-6">
            <label className={labelClass}>Diet type</label>

            <div className="grid gap-3 sm:grid-cols-2">
              {dietOptions.map((option) => {
                const selected = form.dietType === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateField("dietType", option.value)
                    }
                    className={`flex items-start justify-between rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-[#f4773c] bg-[#fff5ef]"
                        : "border-[#e5e0d6] bg-white hover:border-[#f0b294]"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-[#292820]">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs text-[#89867f]">
                        {option.description}
                      </span>
                    </span>

                    {selected && (
                      <Check className="h-5 w-5 shrink-0 text-[#f4773c]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disliked foods */}
          <div className="mt-7 border-t border-[#eee9e0] pt-6">
            <label htmlFor="foodSearch" className={labelClass}>
              Foods you dislike or avoid
            </label>

            <p className="mb-3 text-xs leading-5 text-[#89867f]">
              Search for foods and add them to your avoid list.
            </p>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aaa69c]" />

              <input
                id="foodSearch"
                value={foodSearch}
                onChange={(event) => setFoodSearch(event.target.value)}
                placeholder="Search foods, e.g. mushroom, paneer..."
                className={`${inputClass} pl-11`}
              />
            </div>

            {foodSearch.trim().length >= 2 && (
              <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-[#ebe7df] bg-white">
                {foodsQuery.isFetching ? (
                  <p className="p-4 text-sm text-[#77756f]">
                    Searching foods...
                  </p>
                ) : foodsQuery.isError ? (
                  <p className="p-4 text-sm text-red-700">
                    Food search failed. Please try again.
                  </p>
                ) : searchedFoods.length === 0 ? (
                  <p className="p-4 text-sm text-[#77756f]">
                    No foods found.
                  </p>
                ) : (
                  searchedFoods.map((food) => {
                    const alreadyAdded = selectedFoods.some(
                      (item) => item.id === food.id
                    );

                    return (
                      <button
                        key={food.id}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => addFood(food)}
                        className="flex w-full items-center justify-between border-b border-[#f0ede6] px-4 py-3 text-left last:border-0 hover:bg-[#faf7f1] disabled:cursor-default disabled:opacity-50"
                      >
                        <span className="text-sm font-medium text-[#292820]">
                          {food.name}
                        </span>

                        <span className="text-xs font-medium text-[#a16c4d]">
                          {alreadyAdded ? "Added" : "Add"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {selectedFoods.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedFoods.map((food) => (
                  <span
                    key={food.id}
                    className="inline-flex items-center gap-2 rounded-full border border-[#ead7c8] bg-[#fff5ef] py-2 pl-3 pr-2 text-sm text-[#45443d]"
                  >
                    {food.name}

                    <button
                      type="button"
                      aria-label={`Remove ${food.name}`}
                      onClick={() => removeFood(food.id)}
                      className="rounded-full p-0.5 text-[#a16c4d] hover:bg-[#f5dfd2]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#89867f]">
                No disliked foods selected.
              </p>
            )}
          </div>
        </section>

        {/* Save changes */}
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs leading-5 text-[#89867f]">
            Changes to your personal details and goals affect
            your personalized nutrition estimates.
          </p>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f4773c] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e66b32] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
