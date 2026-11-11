// "use client";

// import {
//   ArrowLeft,
//   CalendarDays,
//   Check,
//   ChevronLeft,
//   ChevronRight,
//   Circle,
//   Flame,
//   Target,
// } from "lucide-react";

// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import Link from "next/link";
// import { useParams } from "next/navigation";

// import {
//   getHabitById,
//   type Habit,
// } from "@/lib/api/habits";

// import {
//   getHabitCompletions,
//   getHabitStats,
//   type Completion,
// } from "@/lib/api/completions";

// function formatFrequency(
//   frequency: Habit["frequency"]
// ): string {
//   switch (frequency) {
//     case "DAILY":
//       return "Daily";
//     case "WEEKLY":
//       return "Weekly";
//     case "CUSTOM":
//       return "Custom";
//     default:
//       return frequency;
//   }
// }

// function formatDate(date: string): string {
//   return new Intl.DateTimeFormat("en-US", {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   }).format(new Date(date));
// }

// function formatShortDate(date: string): string {
//   return new Intl.DateTimeFormat("en-US", {
//     month: "short",
//     day: "numeric",
//   }).format(new Date(date));
// }

// function getCompletionLabel(
//   habit: Habit,
//   completion: Completion
// ): string {
//   if (
//     habit.targetValue !== null &&
//     completion.value !== null
//   ) {
//     return `${completion.value}${habit.targetUnit
//       ? ` ${habit.targetUnit}`
//       : ""
//       }`;
//   }

//   return "Completed";
// }

// type DailyHistory = {
//   date: string;
//   value: number;
//   completed: boolean;
// };

// function buildDailyHistory(
//   habit: Habit,
//   completions: Completion[]
// ): DailyHistory[] {
//   const history = new Map<
//     string,
//     DailyHistory
//   >();

//   for (const completion of completions) {
//     const date = new Date(
//       completion.completedAt
//     ).toLocaleDateString("en-CA");

//     const existing = history.get(date);

//     if (habit.targetValue !== null) {
//       const value =
//         Number(completion.value ?? 0);

//       if (existing) {
//         existing.value += value;
//         existing.completed = true;
//       } else {
//         history.set(date, {
//           date,
//           value,
//           completed: true,
//         });
//       }
//     } else {
//       if (existing) {
//         existing.completed = true;
//       } else {
//         history.set(date, {
//           date,
//           value: 0,
//           completed: true,
//         });
//       }
//     }
//   }

//   return Array.from(history.values()).sort(
//     (a, b) =>
//       new Date(b.date).getTime() -
//       new Date(a.date).getTime()
//   );
// }

// export default function HabitDetailsPage() {
//   const params = useParams<{
//     id: string;
//   }>();

//   const habitId = params.id;

//   const [calendarMonth, setCalendarMonth] = useState(() => {
//     const today = new Date();
//     return new Date(today.getFullYear(), today.getMonth(), 1);
//   });

//   const {
//     data: habit,
//     isLoading: habitLoading,
//     isError: habitError,
//   } = useQuery({
//     queryKey: ["habit", habitId],
//     queryFn: () => getHabitById(habitId),
//     enabled: Boolean(habitId),
//   });

//   const {
//     data: completions = [],
//     isLoading: completionsLoading,
//     isError: completionsError,
//   } = useQuery({
//     queryKey: [
//       "habit",
//       habitId,
//       "completions",
//     ],
//     queryFn: () =>
//       getHabitCompletions(habitId),
//     enabled: Boolean(habitId),
//   });

//   const {
//     data: stats,
//     isLoading: statsLoading,
//     isError: statsError,
//   } = useQuery({
//     queryKey: ["habit", habitId, "stats"],
//     queryFn: () => getHabitStats(habitId),
//     enabled: Boolean(habitId),
//   });

//   if (habitLoading) {
//     return (
//       <main className="space-y-6">
//         <div className="habitbot-card p-8 text-center">
//           <p className="text-sm text-muted-foreground">
//             Loading habit...
//           </p>
//         </div>
//       </main>
//     );
//   }

//   if (habitError || !habit) {
//     return (
//       <main className="space-y-6">
//         <Link
//           href="/habits"
//           className="
//             inline-flex
//             items-center
//             gap-2
//             text-sm
//             font-medium
//             text-muted-foreground
//             transition
//             hover:text-foreground
//           "
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Back to habits
//         </Link>

//         <div className="habitbot-card p-8 text-center">
//           <p className="text-sm font-medium text-foreground">
//             We couldn't load this habit.
//           </p>

//           <p className="mt-1 text-sm text-muted-foreground">
//             The habit may no longer exist.
//           </p>
//         </div>
//       </main>
//     );
//   }

//   const isMeasurable =
//     habit.targetValue !== null;

//   const target =
//     isMeasurable
//       ? Number(habit.targetValue)
//       : null;

//   const today =
//     new Date().toLocaleDateString("en-CA");

//   const todayCompletions =
//     completions.filter(
//       (completion) =>
//         new Date(
//           completion.completedAt
//         ).toLocaleDateString("en-CA") ===
//         today
//     );

//   const todayValue =
//     todayCompletions.reduce(
//       (sum, completion) =>
//         sum +
//         Number(
//           completion.value ?? 0
//         ),
//       0
//     );

//   const todayCompleted =
//     isMeasurable
//       ? target !== null &&
//       todayValue >= target
//       : todayCompletions.length > 0;

//   const todayProgress =
//     isMeasurable &&
//       target !== null &&
//       target > 0
//       ? Math.min(
//         Math.round(
//           (todayValue / target) *
//           100
//         ),
//         100
//       )
//       : todayCompleted
//         ? 100
//         : 0;

//   /*
//    * Convert completion events into
//    * one record per calendar day.
//    *
//    * Measurable habits:
//    * multiple entries are summed.
//    *
//    * Binary habits:
//    * multiple entries become one
//    * completed day.
//    */
//   const dailyHistory =
//     buildDailyHistory(
//       habit,
//       completions
//     );

//   const calendarYear = calendarMonth.getFullYear();
//   const calendarMonthIndex = calendarMonth.getMonth();

//   const firstDayOfMonth = new Date(
//     calendarYear,
//     calendarMonthIndex,
//     1
//   );

//   const daysInMonth = new Date(
//     calendarYear,
//     calendarMonthIndex + 1,
//     0
//   ).getDate();

//   // Monday-first calendar: Monday = 0, Sunday = 6
//   const startingDayOffset = (firstDayOfMonth.getDay() + 6) % 7;

//   const calendarDays = Array.from(
//     { length: startingDayOffset + daysInMonth },
//     (_, index) => {
//       if (index < startingDayOffset) {
//         return null;
//       }

//       return index - startingDayOffset + 1;
//     }
//   );

//   const previousMonth = () => {
//     setCalendarMonth(
//       new Date(calendarYear, calendarMonthIndex - 1, 1)
//     );
//   };

//   const nextMonth = () => {
//     setCalendarMonth(
//       new Date(calendarYear, calendarMonthIndex + 1, 1)
//     );
//   };

//   const calendarMonthLabel = calendarMonth.toLocaleDateString(
//     "en-US",
//     {
//       month: "long",
//       year: "numeric",
//     }
//   );

//   return (
//     <main className="space-y-6">
//       <Link
//         href="/habits"
//         className="
//           inline-flex
//           items-center
//           gap-2
//           text-sm
//           font-medium
//           text-muted-foreground
//           transition
//           hover:text-foreground
//         "
//       >
//         <ArrowLeft className="h-4 w-4" />
//         Back to habits
//       </Link>

//       <section>
//         <div className="flex items-start gap-4">
//           <div
//             className="
//               flex
//               h-12
//               w-12
//               shrink-0
//               items-center
//               justify-center
//               rounded-2xl
//               bg-[#f4773c]/10
//               text-[#f4773c]
//             "
//           >
//             {todayCompleted ? (
//               <Check className="h-6 w-6" />
//             ) : (
//               <Target className="h-6 w-6" />
//             )}
//           </div>

//           <div className="min-w-0">
//             <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
//               {habit.name}
//             </h1>

//             <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
//               <span>
//                 {formatFrequency(
//                   habit.frequency
//                 )}
//               </span>

//               {habit.goal && (
//                 <>
//                   <span>•</span>

//                   <span>
//                     {habit.goal.title}
//                   </span>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         {habit.description && (
//           <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
//             {habit.description}
//           </p>
//         )}
//       </section>

//       <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
//         <div className="habitbot-card p-5">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-muted-foreground">
//                 Today's Progress
//               </p>

//               <div className="mt-2">
//                 {isMeasurable ? (
//                   <p className="text-2xl font-semibold text-foreground">
//                     {todayValue}
//                     {habit.targetUnit
//                       ? ` ${habit.targetUnit}`
//                       : ""}

//                     <span className="text-base font-medium text-muted-foreground">
//                       {" / "}
//                       {habit.targetValue}
//                       {habit.targetUnit
//                         ? ` ${habit.targetUnit}`
//                         : ""}
//                     </span>
//                   </p>
//                 ) : (
//                   <p className="text-2xl font-semibold text-foreground">
//                     {todayCompleted
//                       ? "Completed"
//                       : "Not completed"}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="text-right">
//               <p className="text-2xl font-semibold text-[#f4773c]">
//                 {todayProgress}%
//               </p>
//             </div>
//           </div>

//           <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee9e1]">
//             <div
//               className="h-full rounded-full bg-[#f4773c] transition-all duration-300"
//               style={{
//                 width: `${todayProgress}%`,
//               }}
//             />
//           </div>

//           {isMeasurable &&
//             target !== null && (
//               <p className="mt-2 text-xs text-muted-foreground">
//                 {todayProgress >= 100
//                   ? "Daily target reached"
//                   : `${Math.max(
//                     target - todayValue,
//                     0
//                   )}${habit.targetUnit
//                     ? ` ${habit.targetUnit}`
//                     : ""
//                   } remaining`}
//               </p>
//             )}
//         </div>

//         <div className="habitbot-card p-5">
//           <div className="flex items-center gap-3">
//             <div
//               className="
//                 flex
//                 h-10
//                 w-10
//                 items-center
//                 justify-center
//                 rounded-xl
//                 bg-[#7c865b]/10
//                 text-[#7c865b]
//               "
//             >
//               <Flame className="h-5 w-5" />
//             </div>

//             <div>
//               <p className="text-sm font-medium text-muted-foreground">
//                 Activity
//               </p>

//               <p className="mt-1 text-2xl font-semibold text-foreground">
//                 {dailyHistory.length}
//               </p>

//               <p className="text-xs text-muted-foreground">
//                 days tracked
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Streak Statistics */}
//       <section className="mt-6">
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           {/* Current Streak */}
//           <div className="habitbot-card p-5">
//             <div className="flex items-center justify-between">
//               <p className="text-sm font-medium text-gray-500">
//                 Current Streak
//               </p>
//               <Flame className="h-5 w-5 text-orange-500" />
//             </div>

//             <p className="mt-3 text-3xl font-semibold text-gray-900">
//               {statsLoading ? "—" : statsError ? "—" : stats?.currentStreak ?? 0}
//               <span className="ml-2 text-sm font-normal text-gray-500">
//                 days
//               </span>
//             </p>

//             <p className="mt-2 text-sm text-gray-500">
//               Consecutive days completed
//             </p>
//           </div>

//           {/* Longest Streak */}
//           <div className="habitbot-card p-5">
//             <div className="flex items-center justify-between">
//               <p className="text-sm font-medium text-gray-500">
//                 Longest Streak
//               </p>
//               <Target className="h-5 w-5 text-olive-600" />
//             </div>

//             <p className="mt-3 text-3xl font-semibold text-gray-900">
//               {statsLoading ? "—" : statsError ? "—" : stats?.longestStreak ?? 0}
//               <span className="ml-2 text-sm font-normal text-gray-500">
//                 days
//               </span>
//             </p>

//             <p className="mt-2 text-sm text-gray-500">
//               Your personal best
//             </p>
//           </div>

//           {/* Completion Rate */}
//           <div className="habitbot-card p-5">
//             <div className="flex items-center justify-between">
//               <p className="text-sm font-medium text-gray-500">
//                 Completion Rate
//               </p>
//               <CalendarDays className="h-5 w-5 text-purple-500" />
//             </div>

//             <p className="mt-3 text-3xl font-semibold text-gray-900">
//               {statsLoading
//                 ? "—"
//                 : statsError
//                   ? "—"
//                   : `${Math.round(stats?.completionRate ?? 0)}%`}
//             </p>

//             <p className="mt-2 text-sm text-gray-500">
//               Across your tracking history
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* Habit Calendar */}
//       {/* Calendar and History */}
//       <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
//         <div className="habitbot-card min-w-0 p-4">
//           <div className="flex items-center justify-between gap-4">
//             <div>
//               <h2 className="text-base font-semibold text-foreground">
//                 Habit Calendar
//               </h2>
//               <p className="mt-1 text-sm text-muted-foreground">
//                 Track your consistency day by day.
//               </p>
//             </div>
//             <CalendarDays className="h-5 w-5 text-muted-foreground" />
//           </div>

//           <div className="mt-5 flex items-center justify-between">
//             <h3 className="text-sm font-semibold text-foreground">
//               {calendarMonthLabel}
//             </h3>

//             <div className="flex gap-2">
//               <button
//                 type="button"
//                 onClick={previousMonth}
//                 aria-label="Previous month"
//                 className="rounded-lg border border-[#ebe5dc] p-2 transition hover:bg-[#f7f5f0]"
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </button>

//               <button
//                 type="button"
//                 onClick={nextMonth}
//                 aria-label="Next month"
//                 className="rounded-lg border border-[#ebe5dc] p-2 transition hover:bg-[#f7f5f0]"
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </button>
//             </div>
//           </div>

//           <div className="mt-3 grid grid-cols-7 gap-1.5">
//             {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
//               (day) => (
//                 <div
//                   key={day}
//                   className="py-2 text-center text-xs font-medium text-muted-foreground"
//                 >
//                   {day}
//                 </div>
//               )
//             )}

//             {calendarDays.map((day, index) => {
//               if (day === null) {
//                 return <div key={`empty-${index}`} />;
//               }

//               const date = new Date(
//                 calendarYear,
//                 calendarMonthIndex,
//                 day
//               );

//               const dateKey = [
//                 calendarYear,
//                 String(calendarMonthIndex + 1).padStart(2, "0"),
//                 String(day).padStart(2, "0"),
//               ].join("-");

//               const isToday = dateKey === today;
//               const isFuture = dateKey > today;

//               const dayHistory = dailyHistory.find(
//                 (entry) => entry.date === dateKey
//               );

//               const isCompleted = isMeasurable
//                 ? Boolean(
//                   dayHistory &&
//                   target !== null &&
//                   target > 0 &&
//                   dayHistory.value >= target
//                 )
//                 : Boolean(dayHistory?.completed);

//               const isMissed = !isFuture && !isCompleted;

//               return (
//                 <div
//                   key={dateKey}
//                   title={`${dateKey}: ${isFuture
//                     ? "Upcoming"
//                     : isCompleted
//                       ? "Completed"
//                       : isMissed
//                         ? "Not completed"
//                         : "No activity"
//                     }`}
//                   className={`
//             flex h-9 w-full items-center justify-center
//             rounded-lg border text-sm font-medium transition
//             ${isCompleted
//                       ? "border-[#7c865b] bg-[#7c865b] text-white"
//                       : isToday
//                         ? "border-[#f4773c] bg-[#f4773c]/10 text-[#f4773c]"
//                         : isMissed
//                           ? "border-[#ebe5dc] bg-[#f7f5f0] text-muted-foreground"
//                           : "border-[#ebe5dc] text-muted-foreground"
//                     }
//           `}
//                 >
//                   {day}
//                 </div>
//               );
//             })}
//           </div>

//           <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
//             <div className="flex items-center gap-2">
//               <span className="h-3 w-3 rounded-sm bg-[#7c865b]" />
//               Completed
//             </div>

//             <div className="flex items-center gap-2">
//               <span className="h-3 w-3 rounded-sm bg-[#f7f5f0] ring-1 ring-[#ebe5dc]" />
//               Not completed
//             </div>

//             <div className="flex items-center gap-2">
//               <span className="h-3 w-3 rounded-sm border-2 border-[#f4773c]" />
//               Today
//             </div>

//             <div className="flex items-center gap-2">
//               <span className="h-3 w-3 rounded-sm border border-[#ebe5dc]" />
//               Upcoming
//             </div>
//           </div>
//         </div>

//         {/* Habit History */}
//         <div className="habitbot-card min-w-0 p-4">
//           <div className="flex items-center justify-between gap-4">
//             <div>
//               <h2 className="text-base font-semibold text-foreground">
//                 History
//               </h2>

//               <p className="mt-1 text-sm text-muted-foreground">
//                 Your recorded activity for this habit.
//               </p>
//             </div>

//             <CalendarDays className="h-5 w-5 text-muted-foreground" />
//           </div>

//           {completionsLoading && (
//             <div className="mt-6 py-6 text-center">
//               <p className="text-sm text-muted-foreground">
//                 Loading history...
//               </p>
//             </div>
//           )}

//           {completionsError && (
//             <div className="mt-6 py-6 text-center">
//               <p className="text-sm text-muted-foreground">
//                 We couldn't load the habit history.
//               </p>
//             </div>
//           )}

//           {!completionsLoading &&
//             !completionsError &&
//             dailyHistory.length === 0 && (
//               <div className="mt-6 rounded-xl bg-[#f7f5f0] p-6 text-center">
//                 <p className="text-sm font-medium text-foreground">
//                   No activity yet
//                 </p>

//                 <p className="mt-1 text-sm text-muted-foreground">
//                   Complete this habit to start building
//                   your history.
//                 </p>
//               </div>
//             )}

//           {!completionsLoading &&
//             !completionsError &&
//             dailyHistory.length > 0 && (
//               <div className="mt-5 divide-y divide-[#ebe5dc]">
//                 {dailyHistory
//                   .slice(0, 14)
//                   .map((day) => {
//                     const dayProgress =
//                       isMeasurable &&
//                         target !== null &&
//                         target > 0
//                         ? Math.min(
//                           Math.round(
//                             (day.value /
//                               target) *
//                             100
//                           ),
//                           100
//                         )
//                         : day.completed
//                           ? 100
//                           : 0;

//                     return (
//                       <div
//                         key={day.date}
//                         className="py-4"
//                       >
//                         <div className="flex items-center justify-between gap-4">
//                           <div className="flex items-center gap-3">
//                             <div
//                               className={`
//                               flex
//                               h-8
//                               w-8
//                               shrink-0
//                               items-center
//                               justify-center
//                               rounded-lg
//                               ${dayProgress >=
//                                   100
//                                   ? "bg-[#7c865b]/10 text-[#7c865b]"
//                                   : "bg-[#f4773c]/10 text-[#f4773c]"
//                                 }
//                             `}
//                             >
//                               {dayProgress >=
//                                 100 ? (
//                                 <Check className="h-4 w-4" />
//                               ) : (
//                                 <Circle className="h-4 w-4" />
//                               )}
//                             </div>

//                             <div>
//                               <p className="text-sm font-medium text-foreground">
//                                 {formatShortDate(
//                                   day.date
//                                 )}
//                               </p>

//                               <p className="text-xs text-muted-foreground">
//                                 {formatDate(
//                                   day.date
//                                 )}
//                               </p>
//                             </div>
//                           </div>

//                           <div className="text-right">
//                             {isMeasurable ? (
//                               <>
//                                 <p className="text-sm font-semibold text-foreground">
//                                   {day.value}
//                                   {habit.targetUnit
//                                     ? ` ${habit.targetUnit}`
//                                     : ""}

//                                   {" / "}

//                                   {habit.targetValue}
//                                   {habit.targetUnit
//                                     ? ` ${habit.targetUnit}`
//                                     : ""}
//                                 </p>

//                                 <p
//                                   className={`
//                                   mt-0.5
//                                   text-xs
//                                   ${dayProgress >=
//                                       100
//                                       ? "text-[#7c865b]"
//                                       : "text-muted-foreground"
//                                     }
//                                 `}
//                                 >
//                                   {dayProgress >=
//                                     100
//                                     ? "Target reached"
//                                     : `${dayProgress}% complete`}
//                                 </p>
//                               </>
//                             ) : (
//                               <p className="text-sm font-medium text-[#7c865b]">
//                                 Completed
//                               </p>
//                             )}
//                           </div>
//                         </div>

//                         {isMeasurable && (
//                           <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eee9e1]">
//                             <div
//                               className="h-full rounded-full bg-[#f4773c]"
//                               style={{
//                                 width: `${dayProgress}%`,
//                               }}
//                             />
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//               </div>
//             )}
//         </div>
//       </section>
//     </main>
//   );
// }






"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flame,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";

import { getHabitById, type Habit } from "@/lib/api/habits";
import {
  getHabitCompletions,
  getHabitStats,
  type Completion,
} from "@/lib/api/completions";

const ACCENT = "#f4773c";
const OLIVE = "#7c865b";
const LAVENDER = "#7563a8";

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatShortDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatFrequency(frequency: Habit["frequency"]): string {
  switch (frequency) {
    case "DAILY":
      return "Daily";
    case "WEEKLY":
      return "Weekly";
    case "CUSTOM":
      return "Custom";
    default:
      return frequency;
  }
}

type DailyHistory = {
  date: string;
  value: number;
  completed: boolean;
};

function buildDailyHistory(
  habit: Habit,
  completions: Completion[]
): DailyHistory[] {
  const history = new Map<string, DailyHistory>();

  for (const completion of completions) {
    const date = getLocalDateKey(new Date(completion.completedAt));
    const existing = history.get(date);

    if (existing) {
      if (habit.targetValue !== null) {
        existing.value += Number(completion.value ?? 0);
      }
      existing.completed = true;
      continue;
    }

    history.set(date, {
      date,
      value:
        habit.targetValue !== null
          ? Number(completion.value ?? 0)
          : 0,
      completed: true,
    });
  }

  return Array.from(history.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

function StatCard({
  label,
  value,
  suffix,
  description,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  description: string;
  icon: typeof Flame;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="habitbot-card min-w-0 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          {label}
        </p>
        <Icon
          className="h-5 w-5 shrink-0"
          style={{ color: accent }}
        />
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {loading ? "—" : value}
        {!loading && suffix && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export default function HabitDetailsPage() {
  const params = useParams<{ id: string }>();
  const habitId = params.id;

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const {
    data: habit,
    isLoading: habitLoading,
    isError: habitError,
  } = useQuery({
    queryKey: ["habit", habitId],
    queryFn: () => getHabitById(habitId),
    enabled: Boolean(habitId),
  });

  const {
    data: completions = [],
    isLoading: completionsLoading,
    isError: completionsError,
  } = useQuery({
    queryKey: ["habit", habitId, "completions"],
    queryFn: () => getHabitCompletions(habitId),
    enabled: Boolean(habitId),
  });

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["habit", habitId, "stats"],
    queryFn: () => getHabitStats(habitId),
    enabled: Boolean(habitId),
  });

  if (habitLoading) {
    return (
      <main className="space-y-6">
        <div className="habitbot-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Loading habit...
          </p>
        </div>
      </main>
    );
  }

  if (habitError || !habit) {
    return (
      <main className="space-y-6">
        <Link
          href="/habits"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to habits
        </Link>

        <div className="habitbot-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            We couldn&apos;t load this habit.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The habit may no longer exist.
          </p>
        </div>
      </main>
    );
  }

  const isMeasurable = habit.targetValue !== null;
  const target = isMeasurable ? Number(habit.targetValue) : null;
  const today = getLocalDateKey(new Date());

  const todayCompletions = completions.filter(
    (completion) =>
      getLocalDateKey(new Date(completion.completedAt)) === today
  );

  const todayValue = todayCompletions.reduce(
    (sum, completion) => sum + Number(completion.value ?? 0),
    0
  );

  const todayCompleted = isMeasurable
    ? target !== null && target > 0 && todayValue >= target
    : todayCompletions.length > 0;

  const todayProgress =
    isMeasurable && target !== null && target > 0
      ? Math.min(Math.round((todayValue / target) * 100), 100)
      : todayCompleted
        ? 100
        : 0;

  const dailyHistory = buildDailyHistory(habit, completions);

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();

  const daysInMonth = new Date(
    calendarYear,
    calendarMonthIndex + 1,
    0
  ).getDate();

  const startingDayOffset =
    (new Date(calendarYear, calendarMonthIndex, 1).getDay() + 6) % 7;

  const calendarDays = Array.from(
    { length: startingDayOffset + daysInMonth },
    (_, index) =>
      index < startingDayOffset
        ? null
        : index - startingDayOffset + 1
  );

  const calendarMonthLabel = calendarMonth.toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const previousMonth = () => {
    setCalendarMonth(
      new Date(calendarYear, calendarMonthIndex - 1, 1)
    );
  };

  const nextMonth = () => {
    setCalendarMonth(
      new Date(calendarYear, calendarMonthIndex + 1, 1)
    );
  };

  const historyByDate = new Map(
    dailyHistory.map((entry) => [entry.date, entry])
  );

  return (
    <main className="space-y-5">
      <Link
        href="/habits"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to habits
      </Link>

      {/* Habit heading */}
      <section>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4773c]/10 text-[#f4773c]">
            {todayCompleted ? (
              <Check className="h-5 w-5" />
            ) : (
              <Target className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {habit.name}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{formatFrequency(habit.frequency)}</span>
              {habit.goal && (
                <>
                  <span>·</span>
                  <span>{habit.goal.title}</span>
                </>
              )}
              {!habit.isActive && (
                <>
                  <span>·</span>
                  <span className="text-[#f4773c]">Inactive</span>
                </>
              )}
            </div>
          </div>
        </div>

        {habit.description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {habit.description}
          </p>
        )}
      </section>

      {/* Today's progress and activity */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="habitbot-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                Today&apos;s Progress
              </p>

              {isMeasurable ? (
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {todayValue.toLocaleString()}
                  <span className="text-base font-normal text-muted-foreground">
                    {" / "}
                    {habit.targetValue}
                    {habit.targetUnit ? ` ${habit.targetUnit}` : ""}
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {todayCompleted ? "Completed" : "Not completed"}
                </p>
              )}
            </div>

            <span className="text-2xl font-semibold text-[#f4773c]">
              {todayProgress}%
            </span>
          </div>

          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee9e1]"
            role="progressbar"
            aria-label="Today's habit progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={todayProgress}
          >
            <div
              className="h-full rounded-full bg-[#f4773c] transition-all duration-300"
              style={{ width: `${todayProgress}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {isMeasurable && target !== null
              ? todayProgress >= 100
                ? "Daily target reached"
                : `${Math.max(target - todayValue, 0).toLocaleString()}${habit.targetUnit ? ` ${habit.targetUnit}` : ""} remaining`
              : todayCompleted
                ? "Nice work — habit completed today"
                : "Complete this habit to build your streak"}
          </p>
        </div>

        <div className="habitbot-card flex items-center gap-3 p-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7c865b]/10 text-[#7c865b]">
            <Flame className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Activity
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {dailyHistory.length}
            </p>
            <p className="text-xs text-muted-foreground">
              days with recorded activity
            </p>
          </div>
        </div>
      </section>

      {/* Streak statistics */}
      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-foreground">
            Your consistency
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A quick look at your progress over time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Current Streak"
            value={stats?.currentStreak ?? 0}
            suffix="days"
            description="Consecutive days completed"
            icon={Flame}
            accent={ACCENT}
            loading={statsLoading || statsError}
          />

          <StatCard
            label="Longest Streak"
            value={stats?.longestStreak ?? 0}
            suffix="days"
            description="Your personal best"
            icon={Trophy}
            accent={OLIVE}
            loading={statsLoading || statsError}
          />

          <StatCard
            label="Completion Rate"
            value={`${Math.round(stats?.completionRate ?? 0)}%`}
            description="Across your tracking history"
            icon={TrendingUp}
            accent={LAVENDER}
            loading={statsLoading || statsError}
          />
        </div>
      </section>

      {/* Calendar and history */}
      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        {/* Habit calendar */}
        <div className="habitbot-card min-w-0 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Habit Calendar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your day-by-day consistency.
              </p>
            </div>
            <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              {calendarMonthLabel}
            </h3>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={previousMonth}
                aria-label="Previous month"
                className="rounded-lg border border-[#ebe5dc] p-2 transition hover:bg-[#f7f5f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4773c]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="rounded-lg border border-[#ebe5dc] p-2 transition hover:bg-[#f7f5f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4773c]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day) => (
                <div
                  key={day}
                  className="py-1.5 text-center text-[11px] font-medium text-muted-foreground sm:text-xs"
                >
                  {day}
                </div>
              )
            )}

            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} aria-hidden="true" />;
              }

              const dateKey = [
                calendarYear,
                String(calendarMonthIndex + 1).padStart(2, "0"),
                String(day).padStart(2, "0"),
              ].join("-");

              const isToday = dateKey === today;
              const isFuture = dateKey > today;
              const dayHistory = historyByDate.get(dateKey);

              const isCompleted = isMeasurable
                ? Boolean(
                    dayHistory &&
                      target !== null &&
                      target > 0 &&
                      dayHistory.value >= target
                  )
                : Boolean(dayHistory?.completed);

              const isMissed = !isFuture && !isCompleted;

              const status = isFuture
                ? "Upcoming"
                : isCompleted
                  ? "Completed"
                  : "Not completed";

              return (
                <div
                  key={dateKey}
                  title={`${formatDate(dateKey)} — ${status}`}
                  aria-label={`${formatDate(dateKey)} — ${status}`}
                  className={`flex h-8 w-full items-center justify-center rounded-md border text-xs font-medium transition sm:h-9 ${
                    isCompleted
                      ? "border-[#7c865b] bg-[#7c865b] text-white"
                      : isToday
                        ? "border-[#f4773c] bg-[#f4773c]/10 font-bold text-[#f4773c] ring-1 ring-[#f4773c]/30"
                        : isMissed
                          ? "border-[#ebe5dc] bg-[#f7f5f0] text-muted-foreground"
                          : "border-[#ebe5dc] text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#7c865b]" />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-[#ebe5dc] bg-[#f7f5f0]" />
              Not completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border-2 border-[#f4773c]" />
              Today
            </span>
          </div>
        </div>

        {/* Habit history */}
        <div className="habitbot-card min-w-0 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                History
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest recorded activity.
              </p>
            </div>
            <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>

          {completionsLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading history...
            </p>
          )}

          {completionsError && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              We couldn&apos;t load the habit history.
            </p>
          )}

          {!completionsLoading &&
            !completionsError &&
            dailyHistory.length === 0 && (
              <div className="mt-5 rounded-xl bg-[#f7f5f0] p-5 text-center">
                <CalendarDays className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  No activity yet
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Complete this habit to start building your history.
                </p>
              </div>
            )}

          {!completionsLoading &&
            !completionsError &&
            dailyHistory.length > 0 && (
              <div className="mt-3 divide-y divide-[#ebe5dc]">
                {dailyHistory.slice(0, 14).map((day) => {
                  const dayProgress =
                    isMeasurable && target !== null && target > 0
                      ? Math.min(
                          Math.round((day.value / target) * 100),
                          100
                        )
                      : day.completed
                        ? 100
                        : 0;

                  const dayCompleted = dayProgress >= 100;

                  return (
                    <div key={day.date} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              dayCompleted
                                ? "bg-[#7c865b]/10 text-[#7c865b]"
                                : "bg-[#f4773c]/10 text-[#f4773c]"
                            }`}
                          >
                            {dayCompleted ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {formatShortDate(day.date)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(day.date)}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {isMeasurable ? (
                            <>
                              <p className="text-xs font-semibold text-foreground sm:text-sm">
                                {day.value.toLocaleString()}
                                {habit.targetUnit
                                  ? ` ${habit.targetUnit}`
                                  : ""}
                                {" / "}
                                {habit.targetValue}
                                {habit.targetUnit
                                  ? ` ${habit.targetUnit}`
                                  : ""}
                              </p>
                              <p
                                className="mt-0.5 text-xs"
                                style={{
                                  color: dayCompleted
                                    ? OLIVE
                                    : "var(--muted-foreground)",
                                }}
                              >
                                {dayCompleted
                                  ? "Target reached"
                                  : `${dayProgress}% complete`}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-[#7c865b]">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {isMeasurable && (
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#eee9e1]">
                          <div
                            className="h-full rounded-full bg-[#f4773c] transition-all"
                            style={{ width: `${dayProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </section>
    </main>
  );
}
