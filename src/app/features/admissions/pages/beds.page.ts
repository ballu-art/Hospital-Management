import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BED_STATUSES, BED_TYPES, Bed } from '../../../data-access/models/operations';
import { BED_REPOSITORY } from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';

@Component({
  selector: 'app-beds-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class BedsPage {
  protected readonly config: ResourceConfig<Bed> = {
    title: 'Beds',
    singular: 'Bed',
    subtitle: 'Ward capacity and occupancy. Beds are allocated from the visits screen.',
    icon: 'bed',
    searchLabel: 'Search by ward or bed number',
    repository: inject(BED_REPOSITORY),
    writePermission: 'admissions:write',
    itemLabel: (b) => `${b.number} (${b.ward})`,
    canDelete: (b) => b.status !== 'Occupied',
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: BED_STATUSES.map((s) => ({ value: s, label: s })),
      },
      { key: 'type', label: 'Type', options: BED_TYPES.map((s) => ({ value: s, label: s })) },
    ],
    columns: [
      { key: 'number', header: 'Bed', value: (b) => b.number, sortable: true },
      { key: 'ward', header: 'Ward', value: (b) => b.ward, sortable: true },
      { key: 'type', header: 'Type', value: (b) => b.type, sortable: true, hideBelow: 'sm' },
      { key: 'status', header: 'Status', value: (b) => b.status, chip: true, sortable: true },
    ],
    fields: [
      { key: 'ward', label: 'Ward', type: 'text', required: true, maxLength: 60 },
      { key: 'number', label: 'Bed number', type: 'text', required: true, maxLength: 10 },
      {
        key: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: staticOptions(BED_TYPES),
        defaultValue: 'General',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: staticOptions(['Available', 'Maintenance', 'Occupied']),
        defaultValue: 'Available',
      },
    ],
  };
}
