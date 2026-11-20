
"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Dumbbell,
  Heart,
  Loader2,
  Search,
  Scale,
  Sprout,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  completeOnboarding,
  type PrimaryGoal,
  type Sex,
  type DietType,
  type ActivityLevel,
} from "@/lib/api/profile";

import {
  searchFoods,
  type Food,
} from "@/lib/api/foods";

const steps = [
  "Your goal",
  "Personal details",
  "Diet preference",
  "Foods to avoid",
];

const goalOptions: {
  value: PrimaryGoal;
  title: string;
  description: string;
  icon: typeof Scale;
}[] = [
    {
      value: "WEIGHT_LOSS",
      title: "Lose weight",
      description: "Build healthier habits and manage your weight.",
      icon: Scale,
    },
    {
      value: "MUSCLE_GAIN",
      title: "Build muscle",
      description: "Improve strength and support muscle growth.",
      icon: Dumbbell,
    },
    {
      value: "WEIGHT_MAINTENANCE",
      title: "Maintain weight",
      description: "Maintain your current weight and stay healthy.",
      icon: Heart,
    },
    {
      value: "GENERAL_HEALTH",
      title: "General health",
      description: "Improve your overall health and wellbeing.",
      icon: Sprout,
    },
  ];

const dietOptions: {
  value: DietType;
  title: string;
  description: string;
}[] = [
    {
      value: "VEGETARIAN",
      title: "Vegetarian",
      description: "Plant-based foods and dairy products.",
    },
    {
      value: "NON_VEGETARIAN",
      title: "Non-vegetarian",
      description: "Includes meat, poultry and seafood.",
    },
    {
      value: "EGGETARIAN",
      title: "Eggetarian",
      description: "Vegetarian foods with eggs.",
    },
    {
      value: "VEGAN",
      title: "Vegan",
      description: "Exclusively plant-based foods.",
    },
  ];

const sexOptions: {
  value: Sex;
  label: string;
}[] = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
    {
      value: "PREFER_NOT_TO_SAY",
      label: "Prefer not to say",
    },
  ];

const activityOptions: {
  value: ActivityLevel;
  title: string;
  description: string;
}[] = [
    {
      value: "SEDENTARY",
      title: "Sedentary",
      description: "Little or no exercise; mostly sitting.",
    },
    {
      value: "LIGHT",
      title: "Lightly active",
      description: "Light exercise 1–3 days per week.",
    },
    {
      value: "MODERATE",
      title: "Moderately active",
      description: "Moderate exercise 3–5 days per week.",
    },
    {
      value: "VERY_ACTIVE",
      title: "Very active",
      description: "Hard exercise 6–7 days per week.",
    },
    {
      value: "EXTRA_ACTIVE",
      title: "Extra active",
      description: "Intense exercise or physically demanding work.",
    },
  ];


export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);

  const [primaryGoal, setPrimaryGoal] =
    useState<PrimaryGoal | "">("");

  const [dateOfBirth, setDateOfBirth] =
    useState("");

  const [sex, setSex] = useState<Sex | "">("");

  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel | "">("");

  const [dietType, setDietType] =
    useState<DietType | "">("");

  const [foodSearch, setFoodSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const query = foodSearch.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);

        const result = await searchFoods({
          search: query,
          limit: 8,
        });

        if (!cancelled) {
          setSearchResults(
            result.foods.filter(
              (food) =>
                !selectedFoods.some(
                  (selected) => selected.id === food.id
                )
            )
          );
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [foodSearch, selectedFoods]);

  function selectFood(food: Food) {
    setSelectedFoods((previous) => {
      if (previous.some((item) => item.id === food.id)) {
        return previous;
      }

      return [...previous, food];
    });

    setFoodSearch("");
    setSearchResults([]);
  }

  function removeFood(foodId: string) {
    setSelectedFoods((previous) =>
      previous.filter((food) => food.id !== foodId)
    );
  }

  function validateCurrentStep(): boolean {
    setError("");

    if (currentStep === 0 && !primaryGoal) {
      setError("Please select your primary goal.");
      return false;
    }

    if (currentStep === 1) {
      if (!dateOfBirth) {
        setError("Please enter your date of birth.");
        return false;
      }

      if (!sex) {
        setError("Please select your sex or Prefer not to say.");
        return false;
      }

      if (!heightCm || !weightKg) {
        setError("Please enter your height and weight.");
        return false;
      }

      const height = Number(heightCm);
      const weight = Number(weightKg);

      if (!Number.isFinite(height) || height < 50 || height > 300) {
        setError("Height must be between 50 and 300 cm.");
        return false;
      }

      if (!Number.isFinite(weight) || weight < 2 || weight > 500) {
        setError("Weight must be between 2 and 500 kg.");
        return false;
      }

      if (!activityLevel) {
        setError("Please select your activity level.");
        return false;
      }
    }

    if (currentStep === 2 && !dietType) {
      setError("Please select your diet preference.");
      return false;
    }

    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;

    setCurrentStep((previous) =>
      Math.min(previous + 1, steps.length - 1)
    );
  }

  function goBack() {
    setError("");

    setCurrentStep((previous) =>
      Math.max(previous - 1, 0)
    );
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return;

    if (
      !primaryGoal ||
      !activityLevel ||
      !dateOfBirth ||
      !sex ||
      !heightCm ||
      !weightKg ||
      !dietType
    ) {
      setError("Please complete all required information.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (!primaryGoal || !dietType || !activityLevel) {
        setError("Please complete the required selections.");
        return;
      }

      await completeOnboarding({
        primaryGoal,
        activityLevel,
        dateOfBirth,
        sex,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        dietType,
        dislikedFoodIds: selectedFoods.map(
          (food) => food.id
        ),
      });

      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
          err !== null &&
          "response" in err
          ? (
            err as {
              response?: {
                data?: {
                  error?: {
                    message?: string;
                  };
                };
              };
            }
          ).response?.data?.error?.message
          : undefined;

      setError(
        message ?? "Unable to save your preferences. Please try again."
      );

      setIsSubmitting(false);
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sprout size={21} />
            </div>

            <span className="text-xl font-bold tracking-tight">
              HabitBot
            </span>
          </div>

          <span className="text-sm text-muted-foreground">
            Let's personalize your journey
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-2xl">

          {/* Progress */}
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>

              <span className="text-sm text-muted-foreground">
                {steps[currentStep]}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {index < currentStep ? (
                      <Check size={15} />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-8">

            {/* Step 1: Primary goal */}
            {currentStep === 0 && (
              <div>
                <div className="mb-7">
                  <span className="text-sm font-medium text-primary">
                    YOUR HEALTH JOURNEY
                  </span>

                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    What is your primary goal?
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This helps HabitBot personalize your habits and
                    nutrition recommendations.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {goalOptions.map((goal) => {
                    const Icon = goal.icon;
                    const selected =
                      primaryGoal === goal.value;

                    return (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => {
                          setPrimaryGoal(goal.value);
                          setError("");
                        }}
                        className={`relative flex min-h-36 flex-col items-start rounded-xl border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 ${selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border"
                          }`}
                      >
                        <div className="mb-4 flex w-full items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon size={21} />
                          </div>

                          {selected && (
                            <CheckCircle2
                              size={20}
                              className="text-primary"
                            />
                          )}
                        </div>

                        <span className="font-semibold">
                          {goal.title}
                        </span>

                        <span className="mt-1 text-xs leading-5 text-muted-foreground">
                          {goal.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Personal details */}
            {currentStep === 1 && (
              <div>
                <div className="mb-7">
                  <span className="text-sm font-medium text-primary">
                    ABOUT YOU
                  </span>

                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    Tell us a little about yourself
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    These details help HabitBot calculate your personalized
                    nutrition requirements and recommendations.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="dateOfBirth"
                      className="text-sm font-medium"
                    >
                      Date of birth
                      <span className="ml-1 text-destructive">*</span>
                    </label>

                    <input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      max={new Date().toLocaleDateString("en-CA")}
                      onChange={(event) =>
                        setDateOfBirth(event.target.value)
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Sex
                      <span className="ml-1 text-destructive">*</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {sexOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setSex(
                              sex === option.value
                                ? ""
                                : option.value
                            )
                          }
                          className={`rounded-lg border px-3 py-3 text-sm transition ${sex === option.value
                            ? "border-primary bg-primary/5 font-medium text-primary"
                            : "border-border hover:bg-muted"
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="height"
                        className="text-sm font-medium"
                      >
                        Height (cm)
                        <span className="ml-1 text-destructive">*</span>
                      </label>

                      <input
                        id="height"
                        type="number"
                        min="50"
                        max="300"
                        step="0.1"
                        value={heightCm}
                        onChange={(event) =>
                          setHeightCm(event.target.value)
                        }
                        placeholder="e.g. 175"
                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="weight"
                        className="text-sm font-medium"
                      >
                        Weight (kg)
                        <span className="ml-1 text-destructive">*</span>
                      </label>

                      <input
                        id="weight"
                        type="number"
                        min="2"
                        max="500"
                        step="0.1"
                        value={weightKg}
                        onChange={(event) =>
                          setWeightKg(event.target.value)
                        }
                        placeholder="e.g. 70"
                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">
                        Activity level
                        <span className="ml-1 text-destructive">*</span>
                      </label>

                      <p className="mt-1 text-xs text-muted-foreground">
                        How physically active are you during a typical week?
                      </p>
                    </div>

                    <div className="space-y-2">
                      {activityOptions.map((option) => {
                        const selected = activityLevel === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setActivityLevel(option.value);
                              setError("");
                            }}
                            className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition hover:border-primary/60 hover:bg-primary/5 ${selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border"
                              }`}
                          >
                            <div>
                              <span className="text-sm font-semibold">
                                {option.title}
                              </span>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>

                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40"
                                }`}
                            >
                              {selected && <Check size={13} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    All personal details are required to calculate your
                    personalized nutrition targets. You can update them later.
                    Your sex can be set to "Prefer not to say".
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Diet preference */}
            {currentStep === 2 && (
              <div>
                <div className="mb-7">
                  <span className="text-sm font-medium text-primary">
                    YOUR FOOD PREFERENCES
                  </span>

                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    What's your diet preference?
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    We'll use this to personalize your food and
                    nutrition suggestions.
                  </p>
                </div>

                <div className="space-y-3">
                  {dietOptions.map((diet) => {
                    const selected =
                      dietType === diet.value;

                    return (
                      <button
                        key={diet.value}
                        type="button"
                        onClick={() => {
                          setDietType(diet.value);
                          setError("");
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 ${selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border"
                          }`}
                      >
                        <div>
                          <span className="font-semibold">
                            {diet.title}
                          </span>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {diet.description}
                          </p>
                        </div>

                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                            }`}
                        >
                          {selected && <Check size={13} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-5 text-xs text-muted-foreground">
                  You can update your dietary preference later.
                </p>
              </div>
            )}

            {/* Step 4: Disliked foods */}
            {currentStep === 3 && (
              <div>
                <div className="mb-7">
                  <span className="text-sm font-medium text-primary">
                    PERSONALIZE YOUR FOOD
                  </span>

                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    Any foods you dislike or avoid?
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Search for foods you don't want included in
                    your recommendations. This step is optional.
                  </p>
                </div>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />

                  <input
                    type="text"
                    value={foodSearch}
                    onChange={(event) =>
                      setFoodSearch(event.target.value)
                    }
                    placeholder="Search foods, e.g. mushrooms, paneer..."
                    className="w-full rounded-lg border bg-background py-3 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />

                  {isSearching && (
                    <Loader2
                      size={17}
                      className="absolute right-3 top-1/2 animate-spin text-muted-foreground"
                    />
                  )}
                </div>

                {foodSearch.trim().length === 1 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enter at least 2 characters to search.
                  </p>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-lg border bg-card shadow-sm">
                    {searchResults.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => selectFood(food)}
                        className="flex w-full items-center justify-between border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-muted"
                      >
                        <span className="font-medium">
                          {food.name}
                        </span>

                        <span className="text-xs text-primary">
                          Add
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {foodSearch.trim().length >= 2 &&
                  !isSearching &&
                  searchResults.length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No matching foods found.
                    </p>
                  )}

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Selected foods
                    </h3>

                    <span className="text-xs text-muted-foreground">
                      {selectedFoods.length} selected
                    </span>
                  </div>

                  {selectedFoods.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center">
                      <Sprout
                        size={25}
                        className="mx-auto mb-2 text-muted-foreground"
                      />

                      <p className="text-sm text-muted-foreground">
                        No disliked foods added.
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        You can skip this step if you have no restrictions.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedFoods.map((food) => (
                        <span
                          key={food.id}
                          className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-2 text-sm"
                        >
                          {food.name}

                          <button
                            type="button"
                            onClick={() => removeFood(food.id)}
                            aria-label={`Remove ${food.name}`}
                            className="text-muted-foreground transition hover:text-destructive"
                          >
                            <X size={15} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              {currentStep > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={goNext}
                >
                  Continue
                  <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete setup
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Your preferences help HabitBot provide more relevant
            recommendations. You can update them anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
