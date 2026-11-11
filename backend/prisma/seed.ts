import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ─────────────────────────────────────────────
  // NUTRIENTS
  // ─────────────────────────────────────────────

  const nutrients = await Promise.all([
    prisma.nutrient.upsert({
      where: { code: "CALORIES" },
      update: {},
      create: {
        code: "CALORIES",
        name: "Calories",
        unit: "kcal",
        category: "MACRONUTRIENT"
      }
    }),

    prisma.nutrient.upsert({
      where: { code: "PROTEIN" },
      update: {},
      create: {
        code: "PROTEIN",
        name: "Protein",
        unit: "g",
        category: "MACRONUTRIENT"
      }
    }),

    prisma.nutrient.upsert({
      where: { code: "CARBOHYDRATE" },
      update: {},
      create: {
        code: "CARBOHYDRATE",
        name: "Carbohydrate",
        unit: "g",
        category: "MACRONUTRIENT"
      }
    }),

    prisma.nutrient.upsert({
      where: { code: "FAT" },
      update: {},
      create: {
        code: "FAT",
        name: "Fat",
        unit: "g",
        category: "MACRONUTRIENT"
      }
    }),

    prisma.nutrient.upsert({
      where: { code: "FIBER" },
      update: {},
      create: {
        code: "FIBER",
        name: "Fiber",
        unit: "g",
        category: "MACRONUTRIENT"
      }
    })
  ]);

  const nutrientMap = new Map(
    nutrients.map((nutrient) => [
      nutrient.code,
      nutrient
    ])
  );

  console.log(`✅ ${nutrients.length} nutrients ready.`);

  // ─────────────────────────────────────────────
  // NUTRITION SOURCE
  // ─────────────────────────────────────────────

  const nutritionSource =
    await prisma.nutritionSource.findFirst({
      where: {
        name: "HabitBot Development Dataset",
        version: "1.0"
      }
    });

  const source =
    nutritionSource ??
    (await prisma.nutritionSource.create({
      data: {
        name: "HabitBot Development Dataset",
        version: "1.0",
        description:
          "Development nutrition dataset for AI HabitBot."
      }
    }));

  console.log("✅ Nutrition source ready.");

  // ─────────────────────────────────────────────
  // FOOD CATEGORIES
  // ─────────────────────────────────────────────

  const proteinCategory =
    await prisma.foodCategory.upsert({
      where: {
        slug: "protein"
      },
      update: {},
      create: {
        name: "Protein",
        slug: "protein"
      }
    });

  const dairyCategory =
    await prisma.foodCategory.upsert({
      where: {
        slug: "dairy"
      },
      update: {},
      create: {
        name: "Dairy",
        slug: "dairy"
      }
    });

  const grainsCategory =
    await prisma.foodCategory.upsert({
      where: {
        slug: "grains"
      },
      update: {},
      create: {
        name: "Grains",
        slug: "grains"
      }
    });

  const fruitsCategory =
    await prisma.foodCategory.upsert({
      where: {
        slug: "fruits"
      },
      update: {},
      create: {
        name: "Fruits",
        slug: "fruits"
      }
    });

  const vegetablesCategory =
    await prisma.foodCategory.upsert({
      where: {
        slug: "vegetables"
      },
      update: {},
      create: {
        name: "Vegetables",
        slug: "vegetables"
      }
    });

  console.log("✅ Food categories ready.");

  // ─────────────────────────────────────────────
  // HELPER
  // ─────────────────────────────────────────────

  async function createFood(data: {
    name: string;
    slug: string;
    description?: string;
    foodType: "BASIC" | "PREPARED_DISH";
    dietType:
    | "VEGETARIAN"
    | "NON_VEGETARIAN"
    | "EGGETARIAN"
    | "VEGAN";
    categoryId: string;
    aliases?: string[];
    portions?: {
      name: string;
      grams: number;
    }[];

    nutrition: {
      calories: number;
      protein: number;
      carbohydrate: number;
      fat: number;
      fiber: number;
    };
  }) {
    const food = await prisma.food.upsert({
      where: {
        slug: data.slug
      },
      update: {
        name: data.name,
        description: data.description,
        foodType: data.foodType,
        dietType: data.dietType,
        categoryId: data.categoryId
      },
      create: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        foodType: data.foodType,
        dietType: data.dietType,
        categoryId: data.categoryId
      }
    });

    // Aliases
    for (const alias of data.aliases ?? []) {
      await prisma.foodAlias.upsert({
        where: {
          foodId_alias: {
            foodId: food.id,
            alias
          }
        },
        update: {},
        create: {
          foodId: food.id,
          alias
        }
      });
    }

    // Portions
    for (const portion of data.portions ?? []) {
      await prisma.foodPortion.upsert({
        where: {
          foodId_name: {
            foodId: food.id,
            name: portion.name
          }
        },
        update: {
          grams: portion.grams
        },
        create: {
          foodId: food.id,
          name: portion.name,
          grams: portion.grams
        }
      });
    }

    // Nutrition profile
    const profile =
      await prisma.nutritionProfile.findFirst({
        where: {
          foodId: food.id,
          sourceId: source.id
        }
      });

    const nutritionProfile =
      profile ??
      (await prisma.nutritionProfile.create({
        data: {
          foodId: food.id,
          sourceId: source.id,
          basisGrams: 100
        }
      }));

    const nutritionValues = {
      CALORIES: data.nutrition.calories,
      PROTEIN: data.nutrition.protein,
      CARBOHYDRATE: data.nutrition.carbohydrate,
      FAT: data.nutrition.fat,
      FIBER: data.nutrition.fiber
    };

    for (const [code, value] of Object.entries(
      nutritionValues
    )) {
      const nutrient = nutrientMap.get(code);

      if (!nutrient) {
        throw new Error(
          `Nutrient ${code} was not found`
        );
      }

      await prisma.nutritionProfileItem.upsert({
        where: {
          profileId_nutrientId: {
            profileId: nutritionProfile.id,
            nutrientId: nutrient.id
          }
        },
        update: {
          value
        },
        create: {
          profileId: nutritionProfile.id,
          nutrientId: nutrient.id,
          value
        }
      });
    }

    return food;
  }

  // ─────────────────────────────────────────────
  // FOODS
  // Values below are DEVELOPMENT DATA.
  // They should not be treated as medically precise.
  // ─────────────────────────────────────────────

  const paneer = await createFood({
    name: "Paneer",
    slug: "paneer",
    description: "Indian cottage cheese",
    foodType: "BASIC",
    dietType: "VEGETARIAN",
    categoryId: dairyCategory.id,
    aliases: [
      "Indian cottage cheese"
    ],
    portions: [
      {
        name: "100 g",
        grams: 100
      },
      {
        name: "50 g",
        grams: 50
      }
    ],
    nutrition: {
      calories: 265,
      protein: 18.3,
      carbohydrate: 6.1,
      fat: 20.8,
      fiber: 0
    }
  });

  const mushrooms = await createFood({
    name: "Mushrooms",
    slug: "mushrooms",
    description: "Common edible mushrooms",
    foodType: "BASIC",
    dietType: "VEGETARIAN",
    categoryId: vegetablesCategory.id,
    aliases: [
      "Mushroom"
    ],
    portions: [
      {
        name: "100 g",
        grams: 100
      },
      {
        name: "1 cup",
        grams: 70
      }
    ],
    nutrition: {
      calories: 22,
      protein: 3.1,
      carbohydrate: 3.3,
      fat: 0.3,
      fiber: 1
    }
  });

  await createFood({
    name: "Egg",
    slug: "egg",
    description: "Whole chicken egg",
    foodType: "BASIC",
    dietType: "EGGETARIAN",
    categoryId: proteinCategory.id,
    aliases: [
      "Whole egg",
      "Chicken egg"
    ],
    portions: [
      {
        name: "1 egg",
        grams: 50
      },
      {
        name: "2 eggs",
        grams: 100
      }
    ],
    nutrition: {
      calories: 143,
      protein: 12.6,
      carbohydrate: 0.7,
      fat: 9.5,
      fiber: 0
    }
  });

  await createFood({
    name: "Rice",
    slug: "rice",
    description: "Cooked white rice",
    foodType: "BASIC",
    dietType: "VEGETARIAN",
    categoryId: grainsCategory.id,
    aliases: [
      "White rice",
      "Cooked rice"
    ],
    portions: [
      {
        name: "100 g",
        grams: 100
      },
      {
        name: "1 cup",
        grams: 158
      }
    ],
    nutrition: {
      calories: 130,
      protein: 2.7,
      carbohydrate: 28.2,
      fat: 0.3,
      fiber: 0.4
    }
  });

  await createFood({
    name: "Banana",
    slug: "banana",
    description: "Fresh banana",
    foodType: "BASIC",
    dietType: "VEGETARIAN",
    categoryId: fruitsCategory.id,
    aliases: [
      "Banana fruit"
    ],
    portions: [
      {
        name: "100 g",
        grams: 100
      },
      {
        name: "1 medium banana",
        grams: 118
      }
    ],
    nutrition: {
      calories: 89,
      protein: 1.1,
      carbohydrate: 22.8,
      fat: 0.3,
      fiber: 2.6
    }
  });

  await createFood({
    name: "Chicken Breast",
    slug: "chicken-breast",
    description: "Cooked skinless chicken breast",
    foodType: "BASIC",
    dietType: "NON_VEGETARIAN",
    categoryId: proteinCategory.id,
    aliases: [
      "Chicken",
      "Chicken breast"
    ],
    portions: [
      {
        name: "100 g",
        grams: 100
      },
      {
        name: "150 g",
        grams: 150
      }
    ],
    nutrition: {
      calories: 165,
      protein: 31,
      carbohydrate: 0,
      fat: 3.6,
      fiber: 0
    }
  });

  await createFood({
    name: "Dal",
    slug: "dal",
    description: "Cooked lentils",
    foodType: "PREPARED_DISH",
    dietType: "VEGETARIAN",
    categoryId: proteinCategory.id,
    aliases: [
      "Lentils",
      "Dal curry"
    ],
    portions: [
      {
        name: "100 g",
        grams: 100
      },
      {
        name: "1 cup",
        grams: 198
      }
    ],
    nutrition: {
      calories: 116,
      protein: 9,
      carbohydrate: 20,
      fat: 0.4,
      fiber: 7.9
    }
  });

  console.log("🥘 Food catalog seeded.");

  // ─────────────────────────────────────────────
  // TEST USER
  // ─────────────────────────────────────────────

  const user = await prisma.user.upsert({
    where: {
      email: "test@habitbot.dev"
    },
    update: {},
    create: {
      name: "Test User",
      email: "test@habitbot.dev",
      passwordHash: "temporary-hash",

      profile: {
        create: {
          dateOfBirth: new Date("2001-01-01"),
          sex: "MALE",
          heightCm: 175,
          weightKg: 70,
          activityLevel: "MODERATE",
          primaryGoal: "MUSCLE_GAIN",
          timezone: "Asia/Kolkata"
        }
      },

      dietaryPreference: {
        create: {
          dietType: "NON_VEGETARIAN"
        }
      }
    }
  });

  console.log("👤 Test user ready:", user.email);

  // ─────────────────────────────────────────────
  // MUSHROOM DISLIKE
  // ─────────────────────────────────────────────

  await prisma.userFoodDislike.upsert({
    where: {
      userId_foodId: {
        userId: user.id,
        foodId: mushrooms.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      foodId: mushrooms.id
    }
  });

  console.log("🚫 Mushroom added to user's dislikes.");

  console.log("\n✅ Database seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });