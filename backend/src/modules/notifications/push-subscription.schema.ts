import { z } from "zod";

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Invalid push subscription endpoint"),

  expirationTime: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  keys: z.object({
    p256dh: z.string().min(1, "Missing p256dh key"),
    auth: z.string().min(1, "Missing auth key"),
  }),
});

export type PushSubscriptionInput = z.infer<
  typeof pushSubscriptionSchema
>;