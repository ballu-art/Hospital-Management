import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { combineLatest, map, of, startWith, switchMap } from 'rxjs';
import {
  Appointment,
  AppointmentStatus,
  APPOINTMENT_STATUSES,
  doctorFullName,
} from '../../../data-access/models/appointment';
import { patientFullName } from '../../../data-access/models/patient';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
import {
  DEPARTMENT_REPOSITORY,
  DOCTOR_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import { toErrorMessage } from '../../../shared/models/app-error';
import { fromIsoDate, toIsoDate } from '../../../shared/utils/date';
import { createLookup } from '../../../shared/utils/lookup';
import { errorMessage, notBlank, notPastDate } from '../../../shared/validators/app-validators';
import { AppointmentsService } from '../services/appointments.service';

export type AppointmentDialogMode = 'create' | 'edit' | 'reschedule';

export interface AppointmentDialogData {
  readonly mode: AppointmentDialogMode;
  readonly appointment: Appointment | null;
}

@Component({
  selector: 'app-appointment-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './appointment-form-dialog.component.html',
  styles: `
    .error {
      color: var(--app-color-error);
      margin: var(--app-space-2) 0 0;
    }
  `,
})
export class AppointmentFormDialogComponent {
  protected readonly data = inject<AppointmentDialogData>(MAT_DIALOG_DATA);
  private readonly ref =
    inject<MatDialogRef<AppointmentFormDialogComponent, Appointment>>(MatDialogRef);
  private readonly service = inject(AppointmentsService);

  protected readonly patients = createLookup(inject(PATIENT_REPOSITORY), patientFullName);
  protected readonly doctors = createLookup(inject(DOCTOR_REPOSITORY), doctorFullName);
  protected readonly departments = createLookup(inject(DEPARTMENT_REPOSITORY), (d) => d.name);
  protected readonly statuses: readonly AppointmentStatus[] = APPOINTMENT_STATUSES;
  protected readonly today = new Date();

  private readonly a = this.data.appointment;
  protected readonly rescheduling = this.data.mode === 'reschedule';

  protected readonly form = new FormGroup({
    patientId: new FormControl(this.a?.patientId ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    departmentId: new FormControl(this.a?.departmentId ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    doctorId: new FormControl(this.a?.doctorId ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    date: new FormControl<Date | null>(this.a ? fromIsoDate(this.a.date) : null, {
      validators: [Validators.required, notPastDate],
    }),
    time: new FormControl(this.a?.time ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    reason: new FormControl(this.a?.reason ?? '', {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(200)],
    }),
    status: new FormControl<AppointmentStatus>(this.a?.status ?? 'Scheduled', {
      nonNullable: true,
    }),
  });

  protected readonly saving = signal(false);
  protected readonly attempted = signal(false);
  protected readonly serverError = signal('');

  private readonly departmentId = toSignal(
    this.form.controls.departmentId.valueChanges.pipe(
      startWith(this.form.controls.departmentId.value),
    ),
    { requireSync: true },
  );
  protected readonly doctorOptions = computed(() =>
    [...this.doctors.items().values()].filter((d) => d.departmentId === this.departmentId()),
  );

  protected readonly slots = toSignal(
    combineLatest([
      this.form.controls.date.valueChanges.pipe(startWith(this.form.controls.date.value)),
      this.form.controls.doctorId.valueChanges.pipe(startWith(this.form.controls.doctorId.value)),
    ]).pipe(
      switchMap(([date, doctorId]) =>
        date && doctorId
          ? this.service.availableSlots(toIsoDate(date), doctorId, this.a?.id)
          : of([] as readonly string[]),
      ),
      map((s) => s),
    ),
    { initialValue: [] as readonly string[] },
  );

  protected readonly heading = this.rescheduling
    ? 'Reschedule appointment'
    : this.a
      ? 'Edit appointment'
      : 'Book appointment';

  constructor() {
    if (this.rescheduling) {
      for (const key of ['patientId', 'departmentId', 'doctorId', 'reason', 'status'] as const) {
        this.form.controls[key].disable();
      }
    }
    // Changing department clears the doctor; changing doctor/date clears a no-longer-free time.
    this.form.controls.departmentId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const doc = this.doctors.items().get(this.form.controls.doctorId.value);
      if (doc && doc.departmentId !== this.form.controls.departmentId.value) {
        this.form.controls.doctorId.setValue('');
      }
    });
    combineLatest([this.form.controls.date.valueChanges, this.form.controls.doctorId.valueChanges])
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.time.setValue(''));
  }

  protected err(c: FormControl): string {
    return errorMessage(c);
  }

  protected submit(): void {
    if (this.saving()) return;
    this.attempted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.serverError.set('');

    const v = this.form.getRawValue();
    const date = toIsoDate(v.date as Date);
    const save$ =
      this.rescheduling && this.a
        ? this.service.reschedule(this.a.id, date, v.time)
        : this.a
          ? this.service.update(this.a.id, { ...v, date, reason: v.reason.trim() })
          : this.service.book({ ...v, date, reason: v.reason.trim(), status: 'Scheduled' });

    save$.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (e: unknown) => {
        this.serverError.set(toErrorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
