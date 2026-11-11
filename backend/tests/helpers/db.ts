import { prisma } from "../../src/database/prisma.js";

export async function cleanDatabase(): Promise<void> {
  await prisma.$transaction([
    // AI
    prisma.aIMessage.deleteMany(),
    prisma.aIConversation.deleteMany(),

    // Authentication
    prisma.refreshSession.deleteMany(),

    // Habit domain
    prisma.habitCompletion.deleteMany(),
    prisma.habit.deleteMany(),
    prisma.userGoal.deleteMany(),

    // Nutrition / food logs
    prisma.foodLogItem.deleteMany(),
    prisma.foodLog.deleteMany(),

    // User preferences
    prisma.userFoodDislike.deleteMany(),
    prisma.dietaryPreference.deleteMany(),
    prisma.userProfile.deleteMany(),

    // Users
    prisma.user.deleteMany()
  ]);
}