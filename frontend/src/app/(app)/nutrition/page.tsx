"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
    searchFoods,
    type DietType,
    type Food,
} from "@/lib/api/foods";

import {
    createFoodLog,
    deleteFoodLog,
    type MealType,
} from "@/lib/api/food-logs";

import {
    getTodayNutrition,
    type NutritionTotals,
} from "@/lib/api/nutrition";

const mealOptions: { value: MealType; label: string }[] = [
    { value: "BREAKFAST", label: "Breakfast" },
    { value: "MORNING_SNACK", label: "Morning snack" },
    { value: "LUNCH", label: "Lunch" },
    { value: "EVENING_SNACK", label: "Evening snack" },
    { value: "DINNER", label: "Dinner" },
    { value: "OTHER", label: "Other" },
];

const dietOptions: { value: DietType | ""; label: string }[] = [
    { value: "", label: "All diets" },
    { value: "VEGETARIAN", label: "Vegetarian" },
    { value: "NON_VEGETARIAN", label: "Non-vegetarian" },
    { value: "EGGETARIAN", label: "Eggetarian" },
    { value: "VEGAN", label: "Vegan" },
];

function formatNumber(value: number | undefined, digits = 0) {
    return (value ?? 0).toLocaleString("en-IN", {
        maximumFractionDigits: digits,
    });
}

function getFoodPortions(food: Food): {
    label: string;
    unit: string;
    grams?: number;
}[] {
    const portions = food.portions ?? [];

    return portions.map((portion, index) => {
        const record = portion as Record<string, unknown>;

        const label =
            (typeof record.name === "string" && record.name) ||
            (typeof record.label === "string" && record.label) ||
            (typeof record.unit === "string" && record.unit) ||
            `Portion ${index + 1}`;

        const unit =
            (typeof record.unit === "string" && record.unit) ||
            label;

        const rawGrams =
            typeof record.grams === "number" || typeof record.grams === "string"
                ? Number(record.grams)
                : typeof record.weightInGrams === "number" ||
                    typeof record.weightInGrams === "string"
                    ? Number(record.weightInGrams)
                    : undefined;

        return {
            label,
            unit,
            grams:
                rawGrams !== undefined && Number.isFinite(rawGrams)
                    ? rawGrams
                    : undefined,
        };
    });
}

function MacroCard({
    label,
    value,
    unit,
    color,
}: {
    label: string;
    value: number;
    unit: string;
    color: string;
}) {
    return (
        <div className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-5">
            <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                <p className="text-sm font-medium text-[#77756f]">{label}</p>
            </div>

            <p className="text-2xl font-semibold tracking-tight text-[#292820]">
                {formatNumber(value, 1)}
                <span className="ml-1 text-sm font-normal text-[#89867f]">
                    {unit}
                </span>
            </p>
        </div>
    );
}

function MealLabel({ mealType }: { mealType: MealType }) {
    return (
        <span className="rounded-full bg-[#f2efe8] px-3 py-1 text-xs font-medium text-[#68665d]">
            {mealOptions.find((meal) => meal.value === mealType)?.label ?? mealType}
        </span>
    );
}

export default function NutritionPage() {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [dietType, setDietType] = useState<DietType | "">("");
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [mealType, setMealType] = useState<MealType>("LUNCH");
    const [quantity, setQuantity] = useState("1");
    const [unit, setUnit] = useState("serving");
    const [notes, setNotes] = useState("");

    const nutritionQuery = useQuery({
        queryKey: ["nutrition", "today"],
        queryFn: getTodayNutrition,
    });

    const foodsQuery = useQuery({
        queryKey: ["foods", "search", search, dietType],
        queryFn: () =>
            searchFoods({
                search: search.trim() || undefined,
                dietType: dietType || undefined,
                page: 1,
                limit: 20,
            }),
        enabled: search.trim().length > 0,
    });

    const refreshNutrition = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["nutrition", "today"] }),
            queryClient.invalidateQueries({ queryKey: ["dashboard", "today"] }),
            queryClient.invalidateQueries({ queryKey: ["food-logs"] }),
        ]);
    };

    const createMutation = useMutation({
        mutationFn: createFoodLog,
        onSuccess: async () => {
            toast.success("Meal logged successfully");
            setSelectedFood(null);
            setSearch("");
            setQuantity("1");
            setUnit("serving");
            setNotes("");
            await refreshNutrition();
        },
        onError: () => {
            toast.error("Couldn't log this meal. Please try again.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFoodLog,
        onSuccess: async () => {
            toast.success("Food log deleted");
            await refreshNutrition();
        },
        onError: () => {
            toast.error("Couldn't delete the food log.");
        },
    });

    const nutrition = nutritionQuery.data;
    const totals: NutritionTotals = nutrition?.totals ?? {
        calories: 0,
        protein: 0,
        carbohydrate: 0,
        fat: 0,
        fiber: 0,
    };

    const foods = foodsQuery.data?.foods ?? [];

    const selectedPortions = useMemo(
        () => (selectedFood ? getFoodPortions(selectedFood) : []),
        [selectedFood],
    );

    // function chooseFood(food: Food) {
    //     setSelectedFood(food);

    //     const portions = getFoodPortions(food);
    //     if (portions.length > 0) {
    //         setUnit(portions[0].unit);
    //     } else {
    //         setUnit("serving");
    //     }

    //     setQuantity("1");
    // }

    function chooseFood(food: Food) {
        setSelectedFood(food);

        const portions = getFoodPortions(food);

        setUnit(
            portions.length > 0
                ? portions[0].unit
                : ""
        );

        setQuantity("1");
    }

    function handleLogMeal(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedFood) {
            toast.error("Choose a food first.");
            return;
        }

        const parsedQuantity = Number(quantity);

        if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
            toast.error("Enter a quantity greater than zero.");
            return;
        }

        createMutation.mutate({
            eatenAt: new Date().toISOString(),
            mealType,
            notes: notes.trim() || undefined,
            items: [
                {
                    foodId: selectedFood.id,
                    quantity: parsedQuantity,
                    unit: unit.trim() || "serving",
                },
            ],
        });
    }

    const meals = nutrition?.meals ?? [];

    return (
        <div className="mx-auto w-full max-w-7xl space-y-8 pb-10">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="mb-2 text-sm font-medium text-[#a16c4d]">
                        YOUR DAILY WELLNESS
                    </p>

                    <h1 className="text-3xl font-semibold tracking-tight text-[#292820] sm:text-4xl">
                        Nutrition
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77756f]">
                        Keep track of what you eat and understand your daily nutrition.
                    </p>
                </div>

                <div className="rounded-xl border border-[#ebe7df] bg-[#fffdfa] px-4 py-3 text-sm text-[#77756f]">
                    <span className="mr-2">Today</span>
                    <span className="font-medium text-[#292820]">
                        {new Date().toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        })}
                    </span>
                </div>
            </header>

            {nutritionQuery.isLoading ? (
                <div className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-8 text-sm text-[#77756f]">
                    Loading today's nutrition...
                </div>
            ) : nutritionQuery.isError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                    <p className="font-medium text-red-800">
                        Couldn't load your nutrition summary.
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                        Check that the backend is running and try again.
                    </p>
                    <button
                        type="button"
                        onClick={() => nutritionQuery.refetch()}
                        className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800"
                    >
                        Try again
                    </button>
                </div>
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-2xl bg-[#f4773c] p-5 text-white sm:col-span-2 xl:col-span-1">
                            <p className="text-sm text-white/80">Calories consumed</p>
                            <p className="mt-3 text-3xl font-semibold">
                                {formatNumber(totals.calories)}
                            </p>
                            <p className="mt-1 text-sm text-white/80">kcal today</p>
                        </div>

                        <MacroCard
                            label="Protein"
                            value={totals.protein}
                            unit="g"
                            color="bg-[#7c865b]"
                        />
                        <MacroCard
                            label="Carbohydrates"
                            value={totals.carbohydrate}
                            unit="g"
                            color="bg-[#d3a33a]"
                        />
                        <MacroCard
                            label="Fat"
                            value={totals.fat}
                            unit="g"
                            color="bg-[#7563a8]"
                        />
                        <MacroCard
                            label="Fiber"
                            value={totals.fiber}
                            unit="g"
                            color="bg-[#6585a8]"
                        />
                    </section>

                    <div className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                        <section className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-5 sm:p-6">
                            <div>
                                <h2 className="text-xl font-semibold text-[#292820]">
                                    Log a meal
                                </h2>
                                <p className="mt-1 text-sm text-[#77756f]">
                                    Search your food database and record what you ate.
                                </p>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_180px]">
                                <div>
                                    <label
                                        htmlFor="food-search"
                                        className="mb-2 block text-sm font-medium text-[#45443d]"
                                    >
                                        Search foods
                                    </label>
                                    <input
                                        id="food-search"
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(event.target.value);
                                            setSelectedFood(null);
                                        }}
                                        placeholder="Try paneer, rice, dal..."
                                        className="w-full rounded-xl border border-[#e5e0d6] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c] focus:ring-2 focus:ring-[#f4773c]/15"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="diet-filter"
                                        className="mb-2 block text-sm font-medium text-[#45443d]"
                                    >
                                        Diet preference
                                    </label>
                                    <select
                                        id="diet-filter"
                                        value={dietType}
                                        onChange={(event) =>
                                            setDietType(event.target.value as DietType | "")
                                        }
                                        className="w-full rounded-xl border border-[#e5e0d6] bg-white px-3 py-3 text-sm outline-none focus:border-[#f4773c]"
                                    >
                                        {dietOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {search.trim() && !selectedFood && (
                                <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[#ebe7df]">
                                    {foodsQuery.isFetching ? (
                                        <p className="p-4 text-sm text-[#77756f]">
                                            Searching foods...
                                        </p>
                                    ) : foodsQuery.isError ? (
                                        <p className="p-4 text-sm text-red-700">
                                            Food search failed. Please try again.
                                        </p>
                                    ) : foods.length === 0 ? (
                                        <p className="p-4 text-sm text-[#77756f]">
                                            No foods found. Try a different search.
                                        </p>
                                    ) : (
                                        foods.map((food) => (
                                            <button
                                                type="button"
                                                key={food.id}
                                                onClick={() => chooseFood(food)}
                                                className="flex w-full items-center justify-between gap-3 border-b border-[#f0ede6] px-4 py-3 text-left last:border-b-0 hover:bg-[#faf7f1]"
                                            >
                                                <span>
                                                    <span className="block text-sm font-medium text-[#292820]">
                                                        {food.name}
                                                    </span>
                                                    {food.category?.name && (
                                                        <span className="mt-1 block text-xs text-[#89867f]">
                                                            {food.category.name}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-sm text-[#a16c4d]">Select</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {selectedFood && (
                                <form onSubmit={handleLogMeal} className="mt-5 space-y-4">
                                    <div className="flex items-start justify-between gap-3 rounded-xl bg-[#f7f5f0] p-4">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-[#89867f]">
                                                Selected food
                                            </p>
                                            <p className="mt-1 font-semibold text-[#292820]">
                                                {selectedFood.name}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedFood(null)}
                                            className="text-sm font-medium text-[#a16c4d] hover:underline"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="meal-type"
                                                className="mb-2 block text-sm font-medium text-[#45443d]"
                                            >
                                                Meal
                                            </label>
                                            <select
                                                id="meal-type"
                                                value={mealType}
                                                onChange={(event) =>
                                                    setMealType(event.target.value as MealType)
                                                }
                                                className="w-full rounded-xl border border-[#e5e0d6] bg-white px-3 py-3 text-sm outline-none focus:border-[#f4773c]"
                                            >
                                                {mealOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="food-quantity"
                                                className="mb-2 block text-sm font-medium text-[#45443d]"
                                            >
                                                Quantity
                                            </label>
                                            <input
                                                id="food-quantity"
                                                type="number"
                                                min="0.01"
                                                step="any"
                                                required
                                                value={quantity}
                                                onChange={(event) => setQuantity(event.target.value)}
                                                className="w-full rounded-xl border border-[#e5e0d6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4773c]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="food-unit"
                                            className="mb-2 block text-sm font-medium text-[#45443d]"
                                        >
                                            Serving unit
                                        </label>
                                        {selectedPortions.length > 0 ? (
                                            <select
                                                id="food-unit"
                                                value={unit}
                                                onChange={(event) => setUnit(event.target.value)}
                                                className="w-full rounded-xl border border-[#e5e0d6] bg-white px-3 py-3 text-sm outline-none focus:border-[#f4773c]"
                                            >
                                                {selectedPortions.map((portion, index) => (
                                                    <option
                                                        key={`${portion.unit}-${index}`}
                                                        value={portion.unit}
                                                    >
                                                        {portion.label}
                                                        {portion.grams ? ` (${portion.grams} g)` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                id="food-unit"
                                                value={unit}
                                                onChange={(event) => setUnit(event.target.value)}
                                                required
                                                maxLength={100}
                                                placeholder="e.g. serving, cup, g"
                                                className="w-full rounded-xl border border-[#e5e0d6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4773c]"
                                            />
                                        )}
                                        <p className="mt-2 text-xs leading-5 text-[#89867f]">
                                            Use the serving unit expected by the food database.
                                            Nutrition accuracy depends on the food's configured
                                            portions.
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="meal-notes"
                                            className="mb-2 block text-sm font-medium text-[#45443d]"
                                        >
                                            Notes <span className="font-normal text-[#89867f]">(optional)</span>
                                        </label>
                                        <textarea
                                            id="meal-notes"
                                            rows={2}
                                            maxLength={2000}
                                            value={notes}
                                            onChange={(event) => setNotes(event.target.value)}
                                            placeholder="Anything you'd like to remember about this meal..."
                                            className="w-full resize-y rounded-xl border border-[#e5e0d6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4773c]"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending}
                                        className="w-full rounded-xl bg-[#f4773c] px-4 py-3 font-medium text-white transition hover:bg-[#e66b32] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {createMutation.isPending ? "Saving meal..." : "Log meal"}
                                    </button>
                                </form>
                            )}

                            {!search.trim() && !selectedFood && (
                                <div className="mt-5 rounded-xl border border-dashed border-[#ded8cb] px-4 py-8 text-center">
                                    <p className="font-medium text-[#45443d]">
                                        What did you eat today?
                                    </p>
                                    <p className="mt-1 text-sm text-[#89867f]">
                                        Search for an ingredient or Indian dish to get started.
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-5 sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-[#292820]">
                                        Today's meals
                                    </h2>
                                    <p className="mt-1 text-sm text-[#77756f]">
                                        Your food log for today.
                                    </p>
                                </div>
                                <span className="rounded-full bg-[#f7f5f0] px-3 py-1 text-xs font-medium text-[#68665d]">
                                    {meals.length} {meals.length === 1 ? "meal" : "meals"}
                                </span>
                            </div>

                            {meals.length === 0 ? (
                                <div className="mt-5 rounded-xl bg-[#f7f5f0] px-4 py-8 text-center">
                                    <p className="font-medium text-[#45443d]">
                                        No meals logged yet
                                    </p>
                                    <p className="mt-1 text-sm text-[#89867f]">
                                        Your meals will appear here after you log them.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                    {meals.map((meal) => (
                                        <article
                                            key={meal.id}
                                            className="rounded-xl border border-[#eee9e0] p-4"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <MealLabel mealType={meal.mealType} />
                                                    <span className="text-xs text-[#89867f]">
                                                        {new Date(meal.eatenAt).toLocaleTimeString(
                                                            "en-IN",
                                                            { hour: "numeric", minute: "2-digit" },
                                                        )}
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={deleteMutation.isPending}
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                "Delete this meal from your food log?",
                                                            )
                                                        ) {
                                                            deleteMutation.mutate(meal.id);
                                                        }
                                                    }}
                                                    className="text-xs font-medium text-[#b45e4a] hover:underline disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>

                                            <div className="mt-3 space-y-2">
                                                {meal.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-start justify-between gap-3"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-[#292820]">
                                                                {item.foodName}
                                                            </p>
                                                            <p className="mt-1 text-xs text-[#89867f]">
                                                                {formatNumber(item.quantity, 2)} {item.unit}
                                                                {item.grams > 0
                                                                    ? ` · ${formatNumber(item.grams, 1)} g`
                                                                    : ""}
                                                            </p>
                                                        </div>
                                                        <p className="shrink-0 text-sm font-medium text-[#45443d]">
                                                            {formatNumber(item.calories)} kcal
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#eee9e0] pt-3 text-xs text-[#77756f]">
                                                <span>
                                                    Protein{" "}
                                                    <strong className="text-[#45443d]">
                                                        {formatNumber(meal.totals?.protein ?? 0, 1)} g
                                                    </strong>
                                                </span>
                                                <span>
                                                    Carbs{" "}
                                                    <strong className="text-[#45443d]">
                                                        {formatNumber(meal.totals?.carbohydrate ?? 0, 1)} g
                                                    </strong>
                                                </span>
                                                <span>
                                                    Fat{" "}
                                                    <strong className="text-[#45443d]">
                                                        {formatNumber(meal.totals?.fat ?? 0, 1)} g
                                                    </strong>
                                                </span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}