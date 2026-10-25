import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  GENDERS,
  Gender,
  Patient,
  PatientInput,
  PatientStatus,
} from '../../../data-access/models/patient';
import { fromIsoDate, toIsoDate } from '../../../shared/utils/date';
import {
  notBlank,
  notFutureDate,
  personName,
  phoneNumber,
  plausibleBirthDate,
} from '../../../shared/validators/app-validators';

export type PatientForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  dateOfBirth: FormControl<Date | null>;
  gender: FormControl<Gender | null>;
  phone: FormControl<string>;
  email: FormControl<string>;
  address: FormControl<string>;
  status: FormControl<PatientStatus>;
  emergencyContact: FormGroup<{
    name: FormControl<string>;
    phone: FormControl<string>;
    relationship: FormControl<string>;
  }>;
}>;

export const PATIENT_GENDERS = GENDERS;

/** Builds the typed patient form. Kept separate from components so it can be tested directly. */
export function createPatientForm(): PatientForm {
  const text = (max: number, ...extra: ValidatorFn[]) =>
    new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(max), ...extra],
    });
  return new FormGroup({
    firstName: text(50, personName),
    lastName: text(50, personName),
    dateOfBirth: new FormControl<Date | null>(null, {
      validators: [Validators.required, notFutureDate, plausibleBirthDate],
    }),
    gender: new FormControl<Gender | null>(null, { validators: [Validators.required] }),
    phone: text(20, phoneNumber),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(100)],
    }),
    address: text(200),
    status: new FormControl<PatientStatus>('Active', { nonNullable: true }),
    emergencyContact: new FormGroup({
      name: text(50, personName),
      phone: text(20, phoneNumber),
      relationship: text(30),
    }),
  });
}

export function patchPatientForm(form: PatientForm, p: Patient): void {
  form.reset({
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: fromIsoDate(p.dateOfBirth),
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    address: p.address,
    status: p.status,
    emergencyContact: { ...p.emergencyContact },
  });
}

/** Normalises user-entered text and converts the form value to the domain input. */
export function toPatientInput(form: PatientForm): PatientInput {
  const v = form.getRawValue();
  if (!v.dateOfBirth || !v.gender) {
    throw new Error('Form must be validated before conversion.');
  }
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    dateOfBirth: toIsoDate(v.dateOfBirth),
    gender: v.gender,
    phone: v.phone.trim(),
    email: v.email.trim().toLowerCase(),
    address: v.address.trim(),
    status: v.status,
    emergencyContact: {
      name: v.emergencyContact.name.trim(),
      phone: v.emergencyContact.phone.trim(),
      relationship: v.emergencyContact.relationship.trim(),
    },
  };
}
