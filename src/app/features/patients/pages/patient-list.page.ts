import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PATIENT_STATUSES, Patient, patientFullName } from '../../../data-access/models/patient';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
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
import { ageFromIso, toIsoDate } from '../../../shared/utils/date';
import { ListController } from '../../../shared/utils/list-controller';

@Component({
  selector: 'app-patient-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    RouterLink,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ListToolbarComponent,
    LoadingStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './patient-list.page.html',
  styles: `
    .app-card {
      padding: var(--app-space-4);
      display: grid;
      gap: var(--app-space-3);
    }
    .date {
      flex: 1 1 170px;
    }
  `,
})
export class PatientListPage {
  private readonly repo = inject(PATIENT_REPOSITORY);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly notify = inject(NotificationService);
  protected readonly auth = inject(AuthService);

  protected readonly list = new ListController<Patient>(this.repo);
  protected readonly from = new FormControl<Date | null>(null);
  protected readonly to = new FormControl<Date | null>(null);
  protected readonly filters = [
    {
      key: 'status',
      label: 'Status',
      options: PATIENT_STATUSES.map((s) => ({ value: s, label: s })),
    },
  ];

  protected readonly columns: readonly DataTableColumn<Patient>[] = [
    {
      key: 'medicalRecordNumber',
      header: 'Patient ID',
      value: (p) => p.medicalRecordNumber,
      sortable: true,
      hideBelow: 'sm',
    },
    {
      key: 'name',
      header: 'Name',
      value: (p) => patientFullName(p),
      sortable: true,
      link: (p) => `/patients/${p.id}`,
    },
    {
      key: 'age',
      header: 'Age',
      value: (p) => ageFromIso(p.dateOfBirth),
      sortable: true,
      hideBelow: 'sm',
    },
    { key: 'gender', header: 'Gender', value: (p) => p.gender, sortable: true, hideBelow: 'md' },
    { key: 'phone', header: 'Contact', value: (p) => p.phone, hideBelow: 'md' },
    {
      key: 'registrationDate',
      header: 'Registered',
      value: (p) => p.registrationDate,
      sortable: true,
      hideBelow: 'sm',
    },
    { key: 'status', header: 'Status', value: (p) => p.status, sortable: true, chip: true },
  ];

  protected readonly actions = computed<readonly RowAction<Patient>[]>(() => [
    { id: 'view', label: 'View', icon: 'visibility' },
    ...(this.auth.can('patients:write')
      ? [
          { id: 'edit', label: 'Edit', icon: 'edit' },
          { id: 'delete', label: 'Delete', icon: 'delete', destructive: true },
        ]
      : []),
  ]);

  constructor() {
    // Global top-bar search navigates here with ?search=
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((p) => this.list.applySearch(p.get('search') ?? ''));
    this.from.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((d) => this.list.setFilter('registeredFrom', d ? toIsoDate(d) : ''));
    this.to.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((d) => this.list.setFilter('registeredTo', d ? toIsoDate(d) : ''));
  }

  protected clear(): void {
    this.from.reset(null, { emitEvent: false });
    this.to.reset(null, { emitEvent: false });
    this.list.clearCriteria();
    void this.router.navigate([], { queryParams: {} });
  }

  protected onAction(e: RowActionEvent<Patient>): void {
    if (e.id === 'view') void this.router.navigate(['/patients', e.row.id]);
    else if (e.id === 'edit') void this.router.navigate(['/patients', e.row.id, 'edit']);
    else this.remove(e.row);
  }

  private remove(p: Patient): void {
    this.confirm
      .confirm({
        title: 'Delete patient?',
        message: `${patientFullName(p)} (${p.medicalRecordNumber}) will be removed from the demo data. This cannot be undone.`,
        confirmLabel: 'Delete patient',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.repo.delete(p.id)),
      )
      .subscribe({
        next: () => {
          this.notify.success('Patient deleted.');
          this.list.reload();
        },
        error: (e: unknown) => this.notify.error(toErrorMessage(e)),
      });
  }
}
