import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlertsService } from '../../../core/services/alerts.service';
import {
  LEAVE_STATUSES,
  LEAVE_TYPES,
  LeaveRequest,
  employeeFullName,
} from '../../../data-access/models/hr';
import {
  EMPLOYEE_REPOSITORY,
  LEAVE_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { AppError } from '../../../shared/models/app-error';
import { createLookup } from '../../../shared/utils/lookup';
import { of, tap } from 'rxjs';

@Component({
  selector: 'app-leave-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class LeavePage {
  private readonly repo = inject(LEAVE_REPOSITORY);
  private readonly alerts = inject(AlertsService);
  private readonly employees = createLookup(inject(EMPLOYEE_REPOSITORY), employeeFullName);

  protected readonly config: ResourceConfig<LeaveRequest> = {
    title: 'Leave management',
    singular: 'Leave request',
    subtitle: 'Submit, review and approve leave requests',
    icon: 'beach_access',
    searchLabel: 'Search by leave type or reason',
    repository: this.repo,
    writePermission: 'leave:write',
    itemLabel: (l) => `${this.employees.label(l.employeeId)} (${l.startDate})`,
    defaultSort: { active: 'startDate', direction: 'desc' },
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: LEAVE_STATUSES.map((s) => ({ value: s, label: s })),
      },
      {
        key: 'leaveType',
        label: 'Type',
        options: LEAVE_TYPES.map((s) => ({ value: s, label: s })),
      },
    ],
    columns: [
      { key: 'employeeId', header: 'Employee', value: (l) => this.employees.label(l.employeeId) },
      {
        key: 'leaveType',
        header: 'Type',
        value: (l) => l.leaveType,
        sortable: true,
        hideBelow: 'sm',
      },
      { key: 'startDate', header: 'From', value: (l) => l.startDate, sortable: true },
      { key: 'endDate', header: 'To', value: (l) => l.endDate, hideBelow: 'sm' },
      { key: 'status', header: 'Status', value: (l) => l.status, chip: true, sortable: true },
    ],
    fields: [
      {
        key: 'employeeId',
        label: 'Employee',
        type: 'select',
        required: true,
        options: () => this.employees.options$,
      },
      {
        key: 'leaveType',
        label: 'Leave type',
        type: 'select',
        required: true,
        options: staticOptions(LEAVE_TYPES),
        defaultValue: 'Annual',
      },
      { key: 'startDate', label: 'Start date', type: 'date', required: true },
      { key: 'endDate', label: 'End date', type: 'date', required: true },
      { key: 'reason', label: 'Reason', type: 'textarea', required: true, maxLength: 200 },
    ],
    normalize: (v, prev) => {
      if (String(v['endDate']) < String(v['startDate'])) {
        throw new AppError('validation', 'End date cannot be before the start date.');
      }
      return { ...v, status: prev?.status ?? 'Pending' };
    },
    afterSave: () => {
      this.alerts.refresh();
      return of(null);
    },
    rowActions: [
      {
        id: 'approve',
        label: 'Approve',
        icon: 'check_circle',
        permission: 'leave:approve',
        visible: (l) => l.status === 'Pending',
        run: (l) =>
          this.repo.update(l.id, { status: 'Approved' }).pipe(tap(() => this.alerts.refresh())),
        successMessage: () => 'Leave approved.',
      },
      {
        id: 'reject',
        label: 'Reject',
        icon: 'cancel',
        permission: 'leave:approve',
        destructive: true,
        visible: (l) => l.status === 'Pending',
        confirm: {
          title: 'Reject leave request?',
          message: 'The employee’s request will be marked as rejected.',
          confirmLabel: 'Reject',
        },
        run: (l) =>
          this.repo.update(l.id, { status: 'Rejected' }).pipe(tap(() => this.alerts.refresh())),
        successMessage: () => 'Leave rejected.',
      },
    ],
  };
}
