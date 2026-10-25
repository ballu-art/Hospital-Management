import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { Observable, filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  APPOINTMENT_STATUSES,
  Appointment,
  AppointmentStatus,
  doctorFullName,
} from '../../../data-access/models/appointment';
import { patientFullName } from '../../../data-access/models/patient';
import { APPOINTMENT_REPOSITORY } from '../../../data-access/repositories/appointment.repository';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
import {
  DEPARTMENT_REPOSITORY,
  DOCTOR_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import {
  DataTableColumn,
  DataTableComponent,
  RowAction,
  RowActionEvent,
} from '../../../shared/components/data-table/data-table.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { ListToolbarComponent } from '../../../shared/components/list-toolbar/list-toolbar.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { toErrorMessage } from '../../../shared/models/app-error';
import { toIsoDate } from '../../../shared/utils/date';
import { ListController } from '../../../shared/utils/list-controller';
import { createLookup } from '../../../shared/utils/lookup';
import {
  AppointmentDialogData,
  AppointmentDialogMode,
  AppointmentFormDialogComponent,
} from '../components/appointment-form-dialog.component';
import { DailyScheduleComponent } from '../components/daily-schedule.component';
import { canTransition, isOpen } from '../services/appointment-rules';
import { AppointmentsService } from '../services/appointments.service';

@Component({
  selector: 'app-appointment-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    DailyScheduleComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ListToolbarComponent,
    LoadingStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './appointment-list.page.html',
  styles: `
    .app-card {
      padding: var(--app-space-4);
      display: grid;
      gap: var(--app-space-3);
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-3);
      align-items: flex-start;
    }
    .controls mat-form-field {
      width: auto;
      flex: 1 1 200px;
    }
  `,
})
export class AppointmentListPage {
  private readonly repo = inject(APPOINTMENT_REPOSITORY);
  private readonly service = inject(AppointmentsService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly notify = inject(NotificationService);
  protected readonly auth = inject(AuthService);

  protected readonly patients = createLookup(inject(PATIENT_REPOSITORY), patientFullName);
  protected readonly doctors = createLookup(inject(DOCTOR_REPOSITORY), doctorFullName);
  protected readonly departments = createLookup(inject(DEPARTMENT_REPOSITORY), (d) => d.name);

  protected readonly list = new ListController<Appointment>(this.repo);
  protected readonly view = signal<'list' | 'schedule'>('list');
  protected readonly day = new FormControl<Date>(new Date(), { nonNullable: true });
  protected readonly scheduleDoctor = signal('');
  protected readonly dayAppointments = signal<readonly Appointment[]>([]);
  protected readonly scheduleLoading = signal(false);

  protected readonly filterDefs = computed(() => [
    {
      key: 'status',
      label: 'Status',
      options: APPOINTMENT_STATUSES.map((s) => ({ value: s, label: s })),
    },
    {
      key: 'doctorId',
      label: 'Doctor',
      options: [...this.doctors.items().values()].map((d) => ({
        value: d.id,
        label: doctorFullName(d),
      })),
    },
  ]);

  protected readonly columns: readonly DataTableColumn<Appointment>[] = [
    { key: 'dateTime', header: 'Date & time', value: (a) => `${a.date} ${a.time}`, sortable: true },
    { key: 'patientId', header: 'Patient', value: (a) => this.patients.label(a.patientId) },
    {
      key: 'doctorId',
      header: 'Doctor',
      value: (a) => this.doctors.label(a.doctorId),
      hideBelow: 'sm',
    },
    {
      key: 'departmentId',
      header: 'Department',
      value: (a) => this.departments.label(a.departmentId),
      hideBelow: 'md',
    },
    { key: 'reason', header: 'Reason', value: (a) => a.reason, hideBelow: 'md' },
    { key: 'status', header: 'Status', value: (a) => a.status, sortable: true, chip: true },
  ];

  protected readonly actions = computed<readonly RowAction<Appointment>[]>(() => {
    if (!this.auth.can('appointments:write')) return [];
    const to = (s: AppointmentStatus) => (a: Appointment) => canTransition(a.status, s);
    return [
      { id: 'confirm', label: 'Confirm', icon: 'check_circle', visible: to('Confirmed') },
      { id: 'complete', label: 'Mark completed', icon: 'task_alt', visible: to('Completed') },
      {
        id: 'reschedule',
        label: 'Reschedule',
        icon: 'event_repeat',
        visible: (a) => isOpen(a.status),
      },
      { id: 'edit', label: 'Edit', icon: 'edit', visible: (a) => isOpen(a.status) },
      {
        id: 'cancel',
        label: 'Cancel appointment',
        icon: 'event_busy',
        visible: to('Cancelled'),
        destructive: true,
      },
      { id: 'delete', label: 'Delete', icon: 'delete', destructive: true },
    ];
  });

  constructor() {
    this.list.sort.set({ active: 'dateTime', direction: 'desc' });
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((p) => {
        if (p.get('book') && this.auth.can('appointments:write')) this.openForm(null, 'create');
      });
    this.day.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.loadDay());
  }

  protected setView(v: 'list' | 'schedule'): void {
    this.view.set(v);
    if (v === 'schedule') this.loadDay();
  }

  protected loadDay(): void {
    this.scheduleLoading.set(true);
    this.repo.listForDay(toIsoDate(this.day.value)).subscribe({
      next: (items) => {
        this.dayAppointments.set(items);
        this.scheduleLoading.set(false);
      },
      error: (e: unknown) => {
        this.notify.error(toErrorMessage(e));
        this.scheduleLoading.set(false);
      },
    });
  }

  protected openForm(appointment: Appointment | null, mode: AppointmentDialogMode): void {
    this.dialog
      .open<AppointmentFormDialogComponent, AppointmentDialogData, Appointment>(
        AppointmentFormDialogComponent,
        {
          data: { mode, appointment },
          width: '720px',
          maxWidth: '95vw',
        },
      )
      .afterClosed()
      .pipe(filter((saved): saved is Appointment => !!saved))
      .subscribe(() => {
        this.notify.success(
          mode === 'create'
            ? 'Appointment booked.'
            : mode === 'reschedule'
              ? 'Appointment rescheduled.'
              : 'Appointment updated.',
        );
        this.refresh();
      });
  }

  protected onAction(e: RowActionEvent<Appointment>): void {
    const a = e.row;
    switch (e.id) {
      case 'confirm':
        return this.change(this.service.setStatus(a.id, 'Confirmed'), 'Appointment confirmed.');
      case 'complete':
        return this.change(
          this.service.setStatus(a.id, 'Completed'),
          'Appointment marked completed.',
        );
      case 'edit':
        return this.openForm(a, 'edit');
      case 'reschedule':
        return this.openForm(a, 'reschedule');
      case 'cancel':
        return this.ask(
          'Cancel appointment?',
          `${this.patients.label(a.patientId)} on ${a.date} at ${a.time} will be cancelled.`,
          'Cancel appointment',
          () => this.change(this.service.setStatus(a.id, 'Cancelled'), 'Appointment cancelled.'),
        );
      case 'delete':
        return this.ask(
          'Delete appointment?',
          'The record will be removed from the demo data. This cannot be undone.',
          'Delete',
          () => this.change(this.repo.delete(a.id), 'Appointment deleted.'),
        );
    }
  }

  private ask(title: string, message: string, confirmLabel: string, then: () => void): void {
    this.confirm
      .confirm({ title, message, confirmLabel, cancelLabel: 'Keep', destructive: true })
      .pipe(filter(Boolean))
      .subscribe(then);
  }

  private change(op: Observable<unknown>, message: string): void {
    op.subscribe({
      next: () => {
        this.notify.success(message);
        this.refresh();
      },
      error: (e: unknown) => this.notify.error(toErrorMessage(e)),
    });
  }

  private refresh(): void {
    this.list.reload();
    if (this.view() === 'schedule') this.loadDay();
  }
}
