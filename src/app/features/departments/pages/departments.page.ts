import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DEPARTMENT_STATUSES, Department } from '../../../data-access/models/appointment';
import { DEPARTMENT_REPOSITORY } from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';

@Component({
  selector: 'app-departments-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class DepartmentsPage {
  protected readonly config: ResourceConfig<Department> = {
    title: 'Departments',
    singular: 'Department',
    subtitle: 'Clinical and support departments',
    icon: 'apartment',
    searchLabel: 'Search by name or location',
    repository: inject(DEPARTMENT_REPOSITORY),
    writePermission: 'departments:write',
    itemLabel: (d) => d.name,
    columns: [
      { key: 'name', header: 'Department', value: (d) => d.name, sortable: true },
      { key: 'location', header: 'Location', value: (d) => d.location, hideBelow: 'sm' },
      { key: 'phone', header: 'Phone', value: (d) => d.phone, hideBelow: 'md' },
      { key: 'status', header: 'Status', value: (d) => d.status, chip: true, sortable: true },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, maxLength: 80 },
      { key: 'location', label: 'Location', type: 'text', required: true, maxLength: 80 },
      { key: 'phone', label: 'Phone', type: 'tel', required: true },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: staticOptions(DEPARTMENT_STATUSES),
        defaultValue: 'Active',
      },
    ],
  };
}
