import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Appointment, AppointmentInput } from '../models/appointment';
import { Repository } from './repository';

export type AppointmentRepository = Repository<Appointment, AppointmentInput> & {
  listForDay(date: string): Observable<readonly Appointment[]>;
  listForPatient(patientId: string): Observable<readonly Appointment[]>;
};
export const APPOINTMENT_REPOSITORY = new InjectionToken<AppointmentRepository>(
  'APPOINTMENT_REPOSITORY',
);
