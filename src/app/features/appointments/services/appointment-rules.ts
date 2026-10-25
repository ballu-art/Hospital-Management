import { Appointment, AppointmentStatus } from '../../../data-access/models/appointment';
import { nowTime, toIsoDate } from '../../../shared/utils/date';

/**
 * DEMO scheduling rules. They give realistic feedback in the template, but they are enforced
 * only in the browser/mock layer. A real system must enforce scheduling in the backend with
 * transactional guarantees (two users could otherwise book the same slot concurrently).
 */
export const SLOT_MINUTES = 30;
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 18;

export const TIME_SLOTS: readonly string[] = Array.from(
  { length: ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES },
  (_, i) => {
    const minutes = DAY_START_HOUR * 60 + i * SLOT_MINUTES;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  },
);

export interface SlotCandidate {
  readonly date: string;
  readonly time: string;
  readonly doctorId: string;
  readonly patientId: string;
  /** Appointment being edited (ignored when checking conflicts). */
  readonly excludeId?: string;
}

/** True if the doctor already has an active appointment in the slot. */
export function isDoctorBusy(
  sameDay: readonly Appointment[],
  doctorId: string,
  time: string,
  excludeId?: string,
): boolean {
  return sameDay.some(
    (a) =>
      a.id !== excludeId && a.status !== 'Cancelled' && a.doctorId === doctorId && a.time === time,
  );
}

export function isInPast(date: string, time: string, now: Date = new Date()): boolean {
  const today = toIsoDate(now);
  return date < today || (date === today && time < nowTime(now));
}

/** Returns human-readable rule violations (empty when the slot is acceptable). */
export function validateSlot(
  c: SlotCandidate,
  sameDay: readonly Appointment[],
  now: Date = new Date(),
): string[] {
  const errors: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date)) errors.push('Choose a valid date.');
  if (!TIME_SLOTS.includes(c.time)) {
    errors.push(
      `Choose a ${SLOT_MINUTES}-minute slot between ${TIME_SLOTS[0]} and ${DAY_END_HOUR}:00.`,
    );
  }
  if (errors.length === 0 && isInPast(c.date, c.time, now)) {
    errors.push('Appointments cannot be scheduled in the past.');
  }
  if (isDoctorBusy(sameDay, c.doctorId, c.time, c.excludeId)) {
    errors.push('The doctor already has an appointment at this time.');
  }
  const patientBusy = sameDay.some(
    (a) =>
      a.id !== c.excludeId &&
      a.status !== 'Cancelled' &&
      a.patientId === c.patientId &&
      a.time === c.time,
  );
  if (patientBusy) errors.push('The patient already has an appointment at this time.');
  return errors;
}

const TRANSITIONS: Readonly<Record<AppointmentStatus, readonly AppointmentStatus[]>> = {
  Scheduled: ['Confirmed', 'Completed', 'Cancelled'],
  Confirmed: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export const canTransition = (from: AppointmentStatus, to: AppointmentStatus): boolean =>
  TRANSITIONS[from].includes(to);

/** Only open appointments can be edited or rescheduled. */
export const isOpen = (status: AppointmentStatus): boolean =>
  status === 'Scheduled' || status === 'Confirmed';
