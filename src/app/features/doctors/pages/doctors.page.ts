import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Doctor, DOCTOR_STATUSES, doctorFullName } from '../../../data-access/models/appointment';
import {
  DEPARTMENT_REPOSITORY,
  DOCTOR_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { formatMoney } from '../../../shared/utils/format';
import { createLookup } from '../../../shared/utils/lookup';

@Component({
  selector: 'app-doctors-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class DoctorsPage {
  private readonly departments = createLookup(inject(DEPARTMENT_REPOSITORY), (d) => d.name);

  protected readonly config: ResourceConfig<Doctor> = {
    title: 'Doctors',
    singular: 'Doctor',
    subtitle: 'Medical staff directory and availability',
    icon: 'stethoscope',
    searchLabel: 'Search by name, specialization or email',
    repository: inject(DOCTOR_REPOSITORY),
    writePermission: 'doctors:write',
    itemLabel: doctorFullName,
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: DOCTOR_STATUSES.map((s) => ({ value: s, label: s })),
      },
    ],
    columns: [
      { key: 'lastName', header: 'Name', value: doctorFullName, sortable: true },
      {
        key: 'departmentId',
        header: 'Department',
        value: (d) => this.departments.label(d.departmentId),
        hideBelow: 'sm',
      },
      {
        key: 'specialization',
        header: 'Specialization',
        value: (d) => d.specialization,
        sortable: true,
        hideBelow: 'md',
      },
      {
        key: 'consultationFee',
        header: 'Fee',
        value: (d) => formatMoney(d.consultationFee),
        align: 'end',
        hideBelow: 'md',
      },
      { key: 'status', header: 'Status', value: (d) => d.status, chip: true, sortable: true },
    ],
    fields: [
      { key: 'firstName', label: 'First name', type: 'text', required: true, maxLength: 50 },
      { key: 'lastName', label: 'Last name', type: 'text', required: true, maxLength: 50 },
      {
        key: 'departmentId',
        label: 'Department',
        type: 'select',
        required: true,
        options: () => this.departments.options$,
      },
      {
        key: 'specialization',
        label: 'Specialization',
        type: 'text',
        required: true,
        maxLength: 80,
      },
      { key: 'phone', label: 'Phone', type: 'tel', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'consultationFee', label: 'Consultation fee', type: 'number', required: true, min: 0 },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: staticOptions(DOCTOR_STATUSES),
        defaultValue: 'Available',
      },
    ],
  };
}
