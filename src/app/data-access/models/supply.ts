import { Entity } from '../../shared/models/entity';

export interface Medicine extends Entity {
  readonly name: string;
  readonly category: string;
  readonly stock: number;
  readonly reorderLevel: number;
  readonly unitPrice: number;
  readonly expiryDate: string;
  readonly supplierId: string;
}

export interface InventoryItem extends Entity {
  readonly name: string;
  readonly category: string;
  readonly stock: number;
  readonly reorderLevel: number;
  readonly unit: string;
  readonly location: string;
  readonly supplierId: string;
}

export interface Supplier extends Entity {
  readonly name: string;
  readonly contactPerson: string;
  readonly phone: string;
  readonly email: string;
  readonly status: 'Active' | 'Inactive';
}

export const PO_STATUSES = ['Draft', 'Ordered', 'Received', 'Cancelled'] as const;

export interface PurchaseOrder extends Entity {
  readonly orderNumber: string;
  readonly supplierId: string;
  readonly orderedOn: string;
  readonly expectedOn: string;
  readonly itemsSummary: string;
  readonly total: number;
  readonly status: (typeof PO_STATUSES)[number];
}

export const EXPIRY_WARNING_DAYS = 60;

export function isLowStock(item: { stock: number; reorderLevel: number }): boolean {
  return item.stock <= item.reorderLevel;
}

/** True when a medicine is expired or expires within the warning window. `limitIso` is today + window. */
export function isExpiringSoon(medicine: Medicine, limitIso: string): boolean {
  return medicine.expiryDate <= limitIso;
}
