import { Entity } from '../../shared/models/entity';

export const APPOINTMENT_STATUSES = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface Appointment extends Entity {
  readonly patientId: string;
  readonly doctorId: string;
  readonly departmentId: string;
  /** ISO date (YYYY-MM-DD). */
  readonly date: string;
  /** 24h time (HH:mm). */
  readonly time: string;
  readonly reason: string;
  readonly status: AppointmentStatus;
}

export type AppointmentInput = Omit<Appointment, 'id'>;

export const DOCTOR_STATUSES = ['Available', 'In surgery', 'On leave'] as const;
export type DoctorStatus = (typeof DOCTOR_STATUSES)[number];

export interface Doctor extends Entity {
  readonly firstName: string;
  readonly lastName: string;
  readonly departmentId: string;
  readonly specialization: string;
  readonly phone: string;
  readonly email: string;
  readonly consultationFee: number;
  readonly status: DoctorStatus;
}

export function doctorFullName(d: Pick<Doctor, 'firstName' | 'lastName'>): string {
  return `Dr. ${d.firstName} ${d.lastName}`;
}

export const DEPARTMENT_STATUSES = ['Active', 'Inactive'] as const;

export interface Department extends Entity {
  readonly name: string;
  readonly location: string;
  readonly phone: string;
  readonly status: (typeof DEPARTMENT_STATUSES)[number];
}
