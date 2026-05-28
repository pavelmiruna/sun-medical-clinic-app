export function parseTimeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTimeString(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");

  const minutes = (totalMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function generateSlots(startTime, endTime, slotMinutes) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  const slots = [];

  for (let current = start; current + slotMinutes <= end; current += slotMinutes) {
    slots.push(minutesToTimeString(current));
  }

  return slots;
}

export function getWeekdayFromDateString(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.getDay();
}

export function getDayBounds(dateString) {
  const start = new Date(`${dateString}T00:00:00`);
  const end = new Date(`${dateString}T23:59:59.999`);
  return { start, end };
}

export function combineDateAndTime(dateString, timeString) {
  return new Date(`${dateString}T${timeString}:00`);
}

export function isTimeInsideInterval(time, startTime, endTime) {
  const value = parseTimeToMinutes(time);
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  return value >= start && value < end;
}

export function isValidSlotBoundary(time, startTime, slotMinutes) {
  const value = parseTimeToMinutes(time);
  const start = parseTimeToMinutes(startTime);

  return (value - start) % slotMinutes === 0;
}

export function timeFromDate(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}