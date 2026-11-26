
import { z } from "zod";

const reminderTimeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Reminder time must be in HH:mm format"
  );

export const createHabitReminderSchema = z.object({
  time: reminderTimeSchema,
});

export const updateHabitReminderSchema = z.object({
  time: reminderTimeSchema.optional(),
  isEnabled: z.boolean().optional(),
}).refine(
  (data) =>
    data.time !== undefined ||
    data.isEnabled !== undefined,
  {
    message: "At least one field must be provided",
  }
);

export type CreateHabitReminderInput = z.infer<
  typeof createHabitReminderSchema
>;

export type UpdateHabitReminderInput = z.infer<
  typeof updateHabitReminderSchema
>;
