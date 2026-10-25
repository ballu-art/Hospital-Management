import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { InventoryItem, isLowStock } from '../../../data-access/models/supply';
import {
  INVENTORY_REPOSITORY,
  SUPPLIER_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import { ResourceConfig } from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { createLookup } from '../../../shared/utils/lookup';

@Component({
  selector: 'app-stock-items-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class StockItemsPage {
  private readonly suppliers = createLookup(inject(SUPPLIER_REPOSITORY), (s) => s.name);

  protected readonly config: ResourceConfig<InventoryItem> = {
    title: 'Stock items',
    singular: 'Stock item',
    subtitle: 'Consumables and equipment with reorder levels',
    icon: 'inventory_2',
    searchLabel: 'Search by item, category or location',
    repository: inject(INVENTORY_REPOSITORY),
    writePermission: 'inventory:write',
    itemLabel: (i) => i.name,
    columns: [
      { key: 'name', header: 'Item', value: (i) => i.name, sortable: true },
      {
        key: 'category',
        header: 'Category',
        value: (i) => i.category,
        sortable: true,
        hideBelow: 'md',
      },
      { key: 'stock', header: 'Stock', value: (i) => `${i.stock} ${i.unit}`, align: 'end' },
      { key: 'location', header: 'Location', value: (i) => i.location, hideBelow: 'sm' },
      {
        key: 'status',
        header: 'Level',
        value: (i) => (isLowStock(i) ? 'Low stock' : 'In stock'),
        chip: true,
      },
    ],
    fields: [
      { key: 'name', label: 'Item name', type: 'text', required: true, maxLength: 80 },
      { key: 'category', label: 'Category', type: 'text', required: true, maxLength: 50 },
      { key: 'stock', label: 'Stock on hand', type: 'number', required: true, min: 0 },
      { key: 'reorderLevel', label: 'Reorder level', type: 'number', required: true, min: 0 },
      { key: 'unit', label: 'Unit', type: 'text', required: true, maxLength: 20 },
      { key: 'location', label: 'Storage location', type: 'text', required: true, maxLength: 60 },
      {
        key: 'supplierId',
        label: 'Supplier',
        type: 'select',
        required: true,
        options: () => this.suppliers.options$,
      },
    ],
  };
}
