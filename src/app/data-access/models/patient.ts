import { Entity } from '../../shared/models/entity';
import { PERSON_NAME_PATTERN, PHONE_PATTERN } from '../../shared/validators/patterns';

export const PATIENT_STATUSES = ['Active', 'Inactive'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export const GENDERS = ['Female', 'Male', 'Other'] as const;
export type Gender = (typeof GENDERS)[number];

export interface EmergencyContact {
  readonly name: string;
  readonly phone: string;
  readonly relationship: string;
}

/** Minimal demo patient record. All data in this template is fictional. */
export interface Patient extends Entity {
  readonly medicalRecordNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  /** ISO date (YYYY-MM-DD). */
  readonly dateOfBirth: string;
  readonly gender: Gender;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly emergencyContact: EmergencyContact;
  /** ISO date (YYYY-MM-DD). */
  readonly registrationDate: string;
  readonly status: PatientStatus;
}

/** Fields supplied by the user; id, MRN and registration date are assigned by the data layer. */
export type PatientInput = Omit<Patient, 'id' | 'medicalRecordNumber' | 'registrationDate'>;

export function patientFullName(p: Pick<Patient, 'firstName' | 'lastName'>): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

/** Domain validation, enforced by the data layer in addition to form validation. */
export function validatePatientInput(
  input: Partial<PatientInput>,
  now: Date = new Date(),
): string[] {
  const errors: string[] = [];
  const name = (v: string | undefined) => (v ?? '').trim();
  if (!name(input.firstName)) errors.push('First name is required.');
  else if (!PERSON_NAME_PATTERN.test(name(input.firstName))) errors.push('First name is invalid.');
  if (!name(input.lastName)) errors.push('Last name is required.');
  else if (!PERSON_NAME_PATTERN.test(name(input.lastName))) errors.push('Last name is invalid.');
  if (!input.dateOfBirth) errors.push('Date of birth is required.');
  else if (new Date(input.dateOfBirth) > now) errors.push('Date of birth cannot be in the future.');
  if (!input.gender) errors.push('Gender is required.');
  if (!name(input.phone)) errors.push('Phone is required.');
  else if (!PHONE_PATTERN.test(name(input.phone))) errors.push('Phone number is invalid.');
  return errors;
}
