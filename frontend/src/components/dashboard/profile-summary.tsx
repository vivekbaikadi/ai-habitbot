
import {
  Target,
  Utensils,
  Ruler,
  Weight,
} from "lucide-react";

type ProfileSummaryProps = {
  primaryGoal:
    | "WEIGHT_LOSS"
    | "WEIGHT_MAINTENANCE"
    | "MUSCLE_GAIN"
    | "GENERAL_HEALTH"
    | null;
  dietType:
    | "VEGETARIAN"
    | "NON_VEGETARIAN"
    | "EGGETARIAN"
    | "VEGAN"
    | null;
  heightCm: number | string | null;
  weightKg: number | string | null;
};

const goalLabels = {
  WEIGHT_LOSS: "Weight Loss",
  WEIGHT_MAINTENANCE: "Weight Maintenance",
  MUSCLE_GAIN: "Muscle Gain",
  GENERAL_HEALTH: "General Health",
};

const dietLabels = {
  VEGETARIAN: "Vegetarian",
  NON_VEGETARIAN: "Non-vegetarian",
  EGGETARIAN: "Eggetarian",
  VEGAN: "Vegan",
};

export function ProfileSummary({
  primaryGoal,
  dietType,
  heightCm,
  weightKg,
}: ProfileSummaryProps) {
  const items = [
    {
      label: "Primary Goal",
      value: primaryGoal ? goalLabels[primaryGoal] : "Not set",
      icon: Target,
    },
    {
      label: "Diet Preference",
      value: dietType ? dietLabels[dietType] : "Not set",
      icon: Utensils,
    },
    {
      label: "Height",
      value: heightCm !== null ? `${heightCm} cm` : "Not set",
      icon: Ruler,
    },
    {
      label: "Current Weight",
      value: weightKg !== null ? `${weightKg} kg` : "Not set",
      icon: Weight,
    },
  ];

  return (
    <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-2xl border border-border/70 bg-card p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </div>

              <span className="text-xs font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>

            <p className="text-sm font-semibold text-foreground">
              {item.value}
            </p>
          </div>
        );
      })}
    </section>
  );
}
