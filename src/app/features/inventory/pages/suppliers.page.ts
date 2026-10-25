import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Supplier } from '../../../data-access/models/supply';
import { SUPPLIER_REPOSITORY } from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';

@Component({
  selector: 'app-suppliers-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class SuppliersPage {
  protected readonly config: ResourceConfig<Supplier> = {
    title: 'Suppliers',
    singular: 'Supplier',
    subtitle: 'Vendors for medicines and supplies',
    icon: 'local_shipping',
    searchLabel: 'Search by supplier, contact or email',
    repository: inject(SUPPLIER_REPOSITORY),
    writePermission: 'inventory:write',
    itemLabel: (s) => s.name,
    columns: [
      { key: 'name', header: 'Supplier', value: (s) => s.name, sortable: true },
      { key: 'contactPerson', header: 'Contact', value: (s) => s.contactPerson, hideBelow: 'sm' },
      { key: 'email', header: 'Email', value: (s) => s.email, hideBelow: 'md' },
      { key: 'status', header: 'Status', value: (s) => s.status, chip: true, sortable: true },
    ],
    fields: [
      { key: 'name', label: 'Supplier name', type: 'text', required: true, maxLength: 80 },
      {
        key: 'contactPerson',
        label: 'Contact person',
        type: 'text',
        required: true,
        maxLength: 60,
      },
      { key: 'phone', label: 'Phone', type: 'tel', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: staticOptions(['Active', 'Inactive']),
        defaultValue: 'Active',
      },
    ],
  };
}
