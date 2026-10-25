import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  EXPIRY_WARNING_DAYS,
  Medicine,
  isExpiringSoon,
  isLowStock,
} from '../../../data-access/models/supply';
import {
  MEDICINE_REPOSITORY,
  SUPPLIER_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import { ResourceConfig } from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { isoDaysFromToday, toIsoDate } from '../../../shared/utils/date';
import { createLookup } from '../../../shared/utils/lookup';

function stockStatus(m: Medicine): string {
  if (m.expiryDate < toIsoDate(new Date())) return 'Expired';
  if (isExpiringSoon(m, isoDaysFromToday(EXPIRY_WARNING_DAYS))) return 'Expiring soon';
  return isLowStock(m) ? 'Low stock' : 'In stock';
}

@Component({
  selector: 'app-pharmacy-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class PharmacyPage {
  private readonly suppliers = createLookup(inject(SUPPLIER_REPOSITORY), (s) => s.name);

  protected readonly config: ResourceConfig<Medicine> = {
    title: 'Pharmacy',
    singular: 'Medicine',
    subtitle: 'Medicine stock, reorder levels and expiry dates',
    icon: 'medication',
    searchLabel: 'Search by medicine name or category',
    repository: inject(MEDICINE_REPOSITORY),
    writePermission: 'pharmacy:write',
    itemLabel: (m) => m.name,
    columns: [
      { key: 'name', header: 'Medicine', value: (m) => m.name, sortable: true },
      {
        key: 'category',
        header: 'Category',
        value: (m) => m.category,
        sortable: true,
        hideBelow: 'md',
      },
      { key: 'stock', header: 'Stock', value: (m) => m.stock, sortable: true, align: 'end' },
      {
        key: 'reorderLevel',
        header: 'Reorder at',
        value: (m) => m.reorderLevel,
        align: 'end',
        hideBelow: 'sm',
      },
      {
        key: 'expiryDate',
        header: 'Expiry',
        value: (m) => m.expiryDate,
        sortable: true,
        hideBelow: 'sm',
      },
      { key: 'status', header: 'Stock status', value: stockStatus, chip: true },
    ],
    fields: [
      { key: 'name', label: 'Medicine name', type: 'text', required: true, maxLength: 80 },
      { key: 'category', label: 'Category', type: 'text', required: true, maxLength: 50 },
      { key: 'stock', label: 'Stock on hand', type: 'number', required: true, min: 0 },
      { key: 'reorderLevel', label: 'Reorder level', type: 'number', required: true, min: 0 },
      { key: 'unitPrice', label: 'Unit price', type: 'number', required: true, min: 0 },
      { key: 'expiryDate', label: 'Expiry date', type: 'date', required: true },
      {
        key: 'supplierId',
        label: 'Supplier',
        type: 'select',
        required: true,
        options: () => this.suppliers.options$,
      },
    ],
    rowActions: [],
  };
}
