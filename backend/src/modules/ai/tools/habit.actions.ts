import {
  createHabit
} from "../../habits/habit.service.js";

import {
  createHabitSchema
} from "../../habits/habit.schema.js";

export async function createHabitTool(
  userId: string,
  input: unknown
) {
  const validatedInput =
    createHabitSchema.parse(input);

  const habit =
    await createHabit(
      userId,
      validatedInput
    );

  return {
    success: true,

    habit: {
      id: habit.id,
      name: habit.name,
      description: habit.description,

      goalId: habit.goalId,

      targetValue:
        habit.targetValue !== null
          ? Number(habit.targetValue)
          : null,

      targetUnit:
        habit.targetUnit,

      frequency:
        habit.frequency,

      startDate:
        habit.startDate,

      endDate:
        habit.endDate,

      isActive:
        habit.isActive
    }
  };
}