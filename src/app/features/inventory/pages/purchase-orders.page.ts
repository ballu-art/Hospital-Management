import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PO_STATUSES, PurchaseOrder } from '../../../data-access/models/supply';
import {
  PURCHASE_ORDER_REPOSITORY,
  SUPPLIER_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { formatMoney } from '../../../shared/utils/format';
import { createLookup } from '../../../shared/utils/lookup';

@Component({
  selector: 'app-purchase-orders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class PurchaseOrdersPage {
  private readonly repo = inject(PURCHASE_ORDER_REPOSITORY);
  private readonly suppliers = createLookup(inject(SUPPLIER_REPOSITORY), (s) => s.name);

  protected readonly config: ResourceConfig<PurchaseOrder> = {
    title: 'Purchase orders',
    singular: 'Purchase order',
    subtitle:
      'Orders placed with suppliers. Receiving an order does not update stock in this demo.',
    icon: 'shopping_cart',
    searchLabel: 'Search by order number or items',
    repository: this.repo,
    writePermission: 'inventory:write',
    itemLabel: (p) => p.orderNumber,
    defaultSort: { active: 'orderedOn', direction: 'desc' },
    filters: [
      { key: 'status', label: 'Status', options: PO_STATUSES.map((s) => ({ value: s, label: s })) },
    ],
    columns: [
      { key: 'orderNumber', header: 'Order', value: (p) => p.orderNumber, sortable: true },
      {
        key: 'supplierId',
        header: 'Supplier',
        value: (p) => this.suppliers.label(p.supplierId),
        hideBelow: 'sm',
      },
      {
        key: 'orderedOn',
        header: 'Ordered',
        value: (p) => p.orderedOn,
        sortable: true,
        hideBelow: 'md',
      },
      {
        key: 'total',
        header: 'Total',
        value: (p) => formatMoney(p.total),
        sortable: true,
        align: 'end',
      },
      { key: 'status', header: 'Status', value: (p) => p.status, chip: true, sortable: true },
    ],
    fields: [
      {
        key: 'supplierId',
        label: 'Supplier',
        type: 'select',
        required: true,
        options: () => this.suppliers.options$,
      },
      { key: 'itemsSummary', label: 'Items', type: 'text', required: true, maxLength: 150 },
      {
        key: 'orderedOn',
        label: 'Ordered on',
        type: 'date',
        required: true,
        defaultValue: new Date(),
      },
      { key: 'expectedOn', label: 'Expected on', type: 'date', required: true },
      { key: 'total', label: 'Total', type: 'number', required: true, min: 0 },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: staticOptions(PO_STATUSES),
        defaultValue: 'Draft',
      },
    ],
    normalize: (v, prev) => ({
      ...v,
      orderNumber:
        prev?.orderNumber ??
        `PO-${String(new Date().getFullYear())}-${String(Date.now()).slice(-5)}`,
    }),
    rowActions: [
      {
        id: 'place',
        label: 'Place order',
        icon: 'send',
        visible: (p) => p.status === 'Draft',
        run: (p) => this.repo.update(p.id, { status: 'Ordered' }),
        successMessage: (p) => `${p.orderNumber} placed with supplier.`,
      },
      {
        id: 'receive',
        label: 'Mark received',
        icon: 'inventory',
        visible: (p) => p.status === 'Ordered',
        run: (p) => this.repo.update(p.id, { status: 'Received' }),
        successMessage: (p) => `${p.orderNumber} marked as received.`,
      },
    ],
  };
}
