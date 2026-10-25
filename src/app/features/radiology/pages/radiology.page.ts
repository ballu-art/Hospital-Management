import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { doctorFullName } from '../../../data-access/models/appointment';
import {
  MODALITIES,
  ORDER_STATUSES,
  RadiologyRequest,
} from '../../../data-access/models/operations';
import { patientFullName } from '../../../data-access/models/patient';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
import {
  DOCTOR_REPOSITORY,
  RADIOLOGY_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { createLookup } from '../../../shared/utils/lookup';

@Component({
  selector: 'app-radiology-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class RadiologyPage {
  private readonly repo = inject(RADIOLOGY_REPOSITORY);
  private readonly patients = createLookup(inject(PATIENT_REPOSITORY), patientFullName);
  private readonly doctors = createLookup(inject(DOCTOR_REPOSITORY), doctorFullName);

  protected readonly config: ResourceConfig<RadiologyRequest> = {
    title: 'Radiology',
    singular: 'Imaging request',
    subtitle: 'Imaging requests and reports',
    icon: 'radiology',
    searchLabel: 'Search by modality or body part',
    repository: this.repo,
    writePermission: 'radiology:write',
    itemLabel: (r) => `${r.modality} ${r.bodyPart} – ${this.patients.label(r.patientId)}`,
    defaultSort: { active: 'requestedOn', direction: 'desc' },
    filters: [
      {
        key: 'modality',
        label: 'Modality',
        options: MODALITIES.map((s) => ({ value: s, label: s })),
      },
      {
        key: 'status',
        label: 'Status',
        options: ORDER_STATUSES.map((s) => ({ value: s, label: s })),
      },
    ],
    columns: [
      { key: 'modality', header: 'Modality', value: (r) => r.modality, sortable: true },
      { key: 'bodyPart', header: 'Body part', value: (r) => r.bodyPart, hideBelow: 'sm' },
      { key: 'patientId', header: 'Patient', value: (r) => this.patients.label(r.patientId) },
      {
        key: 'requestedOn',
        header: 'Requested',
        value: (r) => r.requestedOn,
        sortable: true,
        hideBelow: 'md',
      },
      { key: 'status', header: 'Status', value: (r) => r.status, chip: true, sortable: true },
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
        label: 'Requesting doctor',
        type: 'select',
        required: true,
        options: () => this.doctors.options$,
      },
      {
        key: 'modality',
        label: 'Modality',
        type: 'select',
        required: true,
        options: staticOptions(MODALITIES),
        defaultValue: 'X-Ray',
      },
      { key: 'bodyPart', label: 'Body part', type: 'text', required: true, maxLength: 60 },
      {
        key: 'requestedOn',
        label: 'Requested on',
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
      { key: 'report', label: 'Report', type: 'textarea', maxLength: 500 },
    ],
    rowActions: [
      {
        id: 'start',
        label: 'Start scan',
        icon: 'play_arrow',
        visible: (r) => r.status === 'Ordered',
        run: (r) => this.repo.update(r.id, { status: 'In progress' }),
        successMessage: () => 'Imaging request is now in progress.',
      },
    ],
  };
}
