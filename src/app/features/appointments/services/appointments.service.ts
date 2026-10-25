import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap, throwError } from 'rxjs';
import {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
} from '../../../data-access/models/appointment';
import { APPOINTMENT_REPOSITORY } from '../../../data-access/repositories/appointment.repository';
import { DOCTOR_REPOSITORY } from '../../../data-access/repositories/repository-tokens';
import { AppError } from '../../../shared/models/app-error';
import { TIME_SLOTS, canTransition, isInPast, isOpen, validateSlot } from './appointment-rules';

/** Business layer for appointments: applies demo scheduling rules, then delegates storage. */
@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly repo = inject(APPOINTMENT_REPOSITORY);
  private readonly doctors = inject(DOCTOR_REPOSITORY);

  /** Free slots for a doctor on a date (past slots excluded). */
  availableSlots(
    date: string,
    doctorId: string,
    excludeId?: string,
    now = new Date(),
  ): Observable<readonly string[]> {
    return this.repo
      .listForDay(date)
      .pipe(
        map((day) =>
          TIME_SLOTS.filter(
            (time) =>
              !isInPast(date, time, now) &&
              !day.some(
                (a) =>
                  a.id !== excludeId &&
                  a.status !== 'Cancelled' &&
                  a.doctorId === doctorId &&
                  a.time === time,
              ),
          ),
        ),
      );
  }

  book(input: AppointmentInput): Observable<Appointment> {
    return this.checked(input).pipe(
      switchMap(() => this.repo.create({ ...input, status: 'Scheduled' })),
    );
  }

  update(id: string, input: AppointmentInput): Observable<Appointment> {
    return this.repo
      .get(id)
      .pipe(
        switchMap((existing) =>
          isOpen(existing.status)
            ? this.checked(input, id).pipe(switchMap(() => this.repo.update(id, input)))
            : throwError(
                () =>
                  new AppError(
                    'validation',
                    'Completed or cancelled appointments cannot be edited.',
                  ),
              ),
        ),
      );
  }

  reschedule(id: string, date: string, time: string): Observable<Appointment> {
    return this.repo
      .get(id)
      .pipe(switchMap((a) => this.update(id, { ...a, date, time, status: a.status })));
  }

  setStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    return this.repo
      .get(id)
      .pipe(
        switchMap((a) =>
          canTransition(a.status, status)
            ? this.repo.update(id, { status })
            : throwError(
                () =>
                  new AppError(
                    'validation',
                    `A ${a.status.toLowerCase()} appointment cannot become ${status.toLowerCase()}.`,
                  ),
              ),
        ),
      );
  }

  private checked(input: AppointmentInput, excludeId?: string): Observable<void> {
    return forkJoin({
      day: this.repo.listForDay(input.date),
      doctor: this.doctors.get(input.doctorId),
    }).pipe(
      map(({ day, doctor }) => {
        const errors = validateSlot({ ...input, excludeId }, day);
        if (doctor.status === 'On leave') errors.push('The selected doctor is on leave.');
        if (errors.length)
          throw new AppError('conflict', 'This appointment cannot be saved.', errors);
      }),
    );
  }
}
