import "dotenv/config";
import app from "./app.js";
import { markPastAppointmentsAsNoShow } from "./utils/autoNoShow.js";
import { startReminderJob, sendPendingReminders } from "./utils/reminderJob.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

markPastAppointmentsAsNoShow();
setInterval(markPastAppointmentsAsNoShow, 15 * 60 * 1000);

startReminderJob();
sendPendingReminders().catch(() => {});
