import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { doctorFullName } from '../../../data-access/models/appointment';
import { LabOrder, ORDER_STATUSES, PRIORITIES } from '../../../data-access/models/operations';
import { patientFullName } from '../../../data-access/models/patient';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
import {
  DOCTOR_REPOSITORY,
  LAB_ORDER_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { createLookup } from '../../../shared/utils/lookup';

@Component({
  selector: 'app-laboratory-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class LaboratoryPage {
  private readonly repo = inject(LAB_ORDER_REPOSITORY);
  private readonly patients = createLookup(inject(PATIENT_REPOSITORY), patientFullName);
  private readonly doctors = createLookup(inject(DOCTOR_REPOSITORY), doctorFullName);

  protected readonly config: ResourceConfig<LabOrder> = {
    title: 'Laboratory',
    singular: 'Lab order',
    subtitle: 'Test orders and results',
    icon: 'biotech',
    searchLabel: 'Search by test name or status',
    repository: this.repo,
    writePermission: 'laboratory:write',
    itemLabel: (o) => `${o.test} – ${this.patients.label(o.patientId)}`,
    defaultSort: { active: 'orderedOn', direction: 'desc' },
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: ORDER_STATUSES.map((s) => ({ value: s, label: s })),
      },
      {
        key: 'priority',
        label: 'Priority',
        options: PRIORITIES.map((s) => ({ value: s, label: s })),
      },
    ],
    columns: [
      { key: 'test', header: 'Test', value: (o) => o.test, sortable: true },
      { key: 'patientId', header: 'Patient', value: (o) => this.patients.label(o.patientId) },
      {
        key: 'orderedOn',
        header: 'Ordered',
        value: (o) => o.orderedOn,
        sortable: true,
        hideBelow: 'sm',
      },
      {
        key: 'priority',
        header: 'Priority',
        value: (o) => o.priority,
        chip: true,
        hideBelow: 'md',
      },
      { key: 'status', header: 'Status', value: (o) => o.status, chip: true, sortable: true },
    ],
    fields: [
      {
        key: 'patientId',
        label: 'Patient',
        type: 'select',
        required: true,
        options: () => this.patients.options$,
      },
      {
        key: 'doctorId',
        label: 'Ordering doctor',
        type: 'select',
        required: true,
        options: () => this.doctors.options$,
      },
      { key: 'test', label: 'Test', type: 'text', required: true, maxLength: 80 },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        required: true,
        options: staticOptions(PRIORITIES),
        defaultValue: 'Routine',
      },
      {
        key: 'orderedOn',
        label: 'Ordered on',
        type: 'date',
        required: true,
        defaultValue: new Date(),
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: staticOptions(ORDER_STATUSES),
        defaultValue: 'Ordered',
      },
      { key: 'result', label: 'Result', type: 'textarea', maxLength: 500 },
    ],
    rowActions: [
      {
        id: 'start',
        label: 'Start processing',
        icon: 'play_arrow',
        visible: (o) => o.status === 'Ordered',
        run: (o) => this.repo.update(o.id, { status: 'In progress' }),
        successMessage: (o) => `${o.test} is now in progress.`,
      },
    ],
  };
}
