import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import {
  ATTENDANCE_STATUSES,
  AttendanceRecord,
  employeeFullName,
} from '../../../data-access/models/hr';
import {
  ATTENDANCE_REPOSITORY,
  EMPLOYEE_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { toIsoDate } from '../../../shared/utils/date';
import { createLookup } from '../../../shared/utils/lookup';

@Component({
  selector: 'app-attendance-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `
    <app-resource-page [config]="config">
      <p class="summary" role="status">
        Today:
        @for (s of summary(); track s.label) {
          <span
            >{{ s.label }} <strong>{{ s.count }}</strong></span
          >
        }
      </p>
    </app-resource-page>
  `,
  styles: `
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-4);
      margin: 0 0 var(--app-space-3);
    }
  `,
})
export class AttendancePage {
  private readonly repo = inject(ATTENDANCE_REPOSITORY);
  private readonly employees = createLookup(inject(EMPLOYEE_REPOSITORY), employeeFullName);
  private readonly all = toSignal(
    this.repo.all().pipe(catchError(() => of([] as readonly AttendanceRecord[]))),
    { initialValue: [] as readonly AttendanceRecord[] },
  );

  protected readonly summary = computed(() => {
    const today = toIsoDate(new Date());
    const todays = this.all().filter((a) => a.date === today);
    return ATTENDANCE_STATUSES.map((label) => ({
      label,
      count: todays.filter((a) => a.status === label).length,
    }));
  });

  protected readonly config: ResourceConfig<AttendanceRecord> = {
    title: 'Attendance',
    singular: 'Attendance record',
    subtitle: 'Daily check-in and check-out records',
    icon: 'event_available',
    searchLabel: 'Search by date (YYYY-MM-DD) or status',
    repository: this.repo,
    writePermission: 'attendance:write',
    itemLabel: (a) => `${this.employees.label(a.employeeId)} on ${a.date}`,
    defaultSort: { active: 'date', direction: 'desc' },
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: ATTENDANCE_STATUSES.map((s) => ({ value: s, label: s })),
      },
    ],
    columns: [
      { key: 'date', header: 'Date', value: (a) => a.date, sortable: true },
      { key: 'employeeId', header: 'Employee', value: (a) => this.employees.label(a.employeeId) },
      { key: 'checkIn', header: 'Check-in', value: (a) => a.checkIn || '—', hideBelow: 'sm' },
      { key: 'checkOut', header: 'Check-out', value: (a) => a.checkOut || '—', hideBelow: 'sm' },
      { key: 'status', header: 'Status', value: (a) => a.status, chip: true, sortable: true },
    ],
    fields: [
      {
        key: 'employeeId',
        label: 'Employee',
        type: 'select',
        required: true,
        options: () => this.employees.options$,
      },
      { key: 'date', label: 'Date', type: 'date', required: true, defaultValue: new Date() },
      { key: 'checkIn', label: 'Check-in', type: 'time' },
      { key: 'checkOut', label: 'Check-out', type: 'time' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: staticOptions(ATTENDANCE_STATUSES),
        defaultValue: 'Present',
      },
    ],
  };
}
