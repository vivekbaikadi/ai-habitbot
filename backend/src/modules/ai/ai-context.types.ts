export interface AIUserContext {
  user: {
    id: string;
    name: string;
    timezone: string;
    dietType: string | null;
    primaryGoal: string | null;
    activityLevel: string | null;
  };

  today: {
    date: string;

    habits: {
      total: number;
      completed: number;
      pending: number;
      completionRate: number;
    };

    nutrition: {
      calories: number;
      protein: number;
      carbohydrate: number;
      fat: number;
      fiber: number;

      meals: Array<{
        id: string;
        mealType: string;
        eatenAt: string;

        totals: {
          calories: number;
          protein: number;
          carbohydrate: number;
          fat: number;
          fiber: number;
        };

        items: Array<{
          foodName: string;
          quantity: number;
          unit: string;
          grams: number;
          calories: number;
          protein: number;
          carbohydrate: number;
          fat: number;
          fiber: number;
        }>;
      }>;
    };
  };

  goals: Array<{
    id: string;
    title: string;
    description: string | null;
  }>;

  habits: Array<{
    id: string;
    name: string;
    goalId: string | null;
    targetValue: number | null;
    targetUnit: string | null;
    frequency: string;

    today: {
      completed: boolean;
      value: number | null;
    };

    stats: {
      currentStreak: number;
      longestStreak: number;
      completionRate: number;
    };
  }>;

  dietaryRestrictions: {
    dislikedFoods: string[];
  };
}