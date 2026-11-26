
import app from "./app.js";
import { env } from "./config/env.js";
import { startReminderScheduler } from "./modules/habits/reminder.scheduler.js";

app.listen(env.PORT, () => {
  console.log(
    `AI HabitBot API running on http://localhost:${env.PORT}`
  );

  startReminderScheduler();
});
