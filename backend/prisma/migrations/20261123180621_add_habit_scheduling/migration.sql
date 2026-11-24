-- CreateEnum
CREATE TYPE "HabitWeekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "customDays" "HabitWeekday"[] DEFAULT ARRAY[]::"HabitWeekday"[],
ADD COLUMN     "weeklyTarget" INTEGER;
