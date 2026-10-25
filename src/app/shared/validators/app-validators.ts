import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MAX_AGE_YEARS, PERSON_NAME_PATTERN, PHONE_PATTERN } from './patterns';

/** Rejects values that are empty after trimming (the built-in required allows whitespace). */
export const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: unknown = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0
    ? { notBlank: true }
    : null;
};

export const personName: ValidatorFn = (control) => {
  const value: unknown = control.value;
  return typeof value === 'string' && value.trim() && !PERSON_NAME_PATTERN.test(value.trim())
    ? { personName: true }
    : null;
};

export const phoneNumber: ValidatorFn = (control) => {
  const value: unknown = control.value;
  return typeof value === 'string' && value.trim() && !PHONE_PATTERN.test(value.trim())
    ? { phone: true }
    : null;
};

function asDate(value: unknown): Date | null {
  return value instanceof Date && !isNaN(value.getTime()) ? value : null;
}

export const notFutureDate: ValidatorFn = (control) => {
  const date = asDate(control.value);
  if (!date) return null;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return date > endOfToday ? { futureDate: true } : null;
};

export const plausibleBirthDate: ValidatorFn = (control) => {
  const date = asDate(control.value);
  if (!date) return null;
  const oldest = new Date();
  oldest.setFullYear(oldest.getFullYear() - MAX_AGE_YEARS);
  return date < oldest ? { tooOld: true } : null;
};

export const notPastDate: ValidatorFn = (control) => {
  const date = asDate(control.value);
  if (!date) return null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return date < startOfToday ? { pastDate: true } : null;
};

const MESSAGES: Record<string, (e: ValidationErrors) => string> = {
  required: () => 'This field is required.',
  notBlank: () => 'This field cannot be blank.',
  email: () => 'Enter a valid email address.',
  personName: () => 'Use letters, spaces, hyphens or apostrophes only.',
  phone: () => 'Enter a valid phone number (7–15 digits, optional +).',
  futureDate: () => 'Date cannot be in the future.',
  tooOld: () => 'Enter a realistic date of birth.',
  pastDate: () => 'Date cannot be in the past.',
  maxlength: (e) =>
    `Maximum ${String((e['maxlength'] as { requiredLength: number }).requiredLength)} characters.`,
  minlength: (e) =>
    `Minimum ${String((e['minlength'] as { requiredLength: number }).requiredLength)} characters.`,
  min: (e) => `Minimum value is ${String((e['min'] as { min: number }).min)}.`,
  max: (e) => `Maximum value is ${String((e['max'] as { max: number }).max)}.`,
  matDatepickerParse: () => 'Enter a valid date.',
  pattern: () => 'Value is not in the expected format.',
  slotTaken: () => 'This time is no longer available.',
};

/** First user-facing message for a control's errors, or an empty string. */
export function errorMessage(control: AbstractControl | null): string {
  if (!control?.errors) return '';
  const [key] = Object.keys(control.errors);
  const factory = MESSAGES[key];
  return factory ? factory(control.errors) : 'This value is not valid.';
}
