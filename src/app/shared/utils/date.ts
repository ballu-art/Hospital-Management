const pad = (n: number): string => String(n).padStart(2, '0');

/** Formats a Date as a local calendar date (YYYY-MM-DD) without timezone shifts. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses YYYY-MM-DD as a local date at midnight. */
export function fromIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function isoDaysFromToday(days: number, now: Date = new Date()): string {
  return toIsoDate(addDays(now, days));
}

export function ageFromIso(dateOfBirth: string, now: Date = new Date()): number {
  const dob = fromIsoDate(dateOfBirth);
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) {
    age -= 1;
  }
  return age;
}

/** Current local time as HH:mm. */
export function nowTime(now: Date = new Date()): string {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
