
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getHabitReminders,
  createHabitReminder,
  updateHabitReminder,
  deleteHabitReminder,
  type CreateHabitReminderInput,
  type UpdateHabitReminderInput,
} from "@/lib/api/habits";

export function useHabitReminders(habitId: string) {
  return useQuery({
    queryKey: ["habit", habitId, "reminders"],
    queryFn: () => getHabitReminders(habitId),
    enabled: Boolean(habitId),
  });
}

export function useCreateHabitReminder(habitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitReminderInput) =>
      createHabitReminder(habitId, input),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["habit", habitId, "reminders"],
      });
    },
  });
}

export function useUpdateHabitReminder(habitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reminderId,
      input,
    }: {
      reminderId: string;
      input: UpdateHabitReminderInput;
    }) => updateHabitReminder(habitId, reminderId, input),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["habit", habitId, "reminders"],
      });
    },
  });
}

export function useDeleteHabitReminder(habitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reminderId: string) =>
      deleteHabitReminder(habitId, reminderId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["habit", habitId, "reminders"],
      });
    },
  });
}
