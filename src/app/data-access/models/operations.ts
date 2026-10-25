import { Entity } from '../../shared/models/entity';

export const VISIT_TYPES = ['OPD', 'IPD'] as const;
export const VISIT_STATUSES = ['Open', 'Discharged'] as const;

/** OPD (outpatient) or IPD (inpatient) visit. IPD visits are allocated a bed. */
export interface Admission extends Entity {
  readonly patientId: string;
  readonly doctorId: string;
  readonly departmentId: string;
  readonly type: (typeof VISIT_TYPES)[number];
  readonly admittedOn: string;
  readonly dischargedOn: string;
  readonly bedId: string;
  readonly diagnosis: string;
  readonly status: (typeof VISIT_STATUSES)[number];
}

export const BED_TYPES = ['General', 'Private', 'ICU'] as const;
export const BED_STATUSES = ['Available', 'Occupied', 'Maintenance'] as const;
export type BedStatus = (typeof BED_STATUSES)[number];

export interface Bed extends Entity {
  readonly ward: string;
  readonly number: string;
  readonly type: (typeof BED_TYPES)[number];
  readonly status: BedStatus;
}

export const BILL_STATUSES = ['Unpaid', 'Partially paid', 'Paid'] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export interface Bill extends Entity {
  readonly invoiceNumber: string;
  readonly patientId: string;
  readonly description: string;
  readonly issuedOn: string;
  readonly dueOn: string;
  readonly amount: number;
  readonly paidAmount: number;
  readonly status: BillStatus;
}

export function billStatusOf(amount: number, paid: number): BillStatus {
  return paid >= amount ? 'Paid' : paid > 0 ? 'Partially paid' : 'Unpaid';
}

export const ORDER_STATUSES = ['Ordered', 'In progress', 'Completed'] as const;
export const PRIORITIES = ['Routine', 'Urgent'] as const;

export interface LabOrder extends Entity {
  readonly patientId: string;
  readonly doctorId: string;
  readonly test: string;
  readonly priority: (typeof PRIORITIES)[number];
  readonly orderedOn: string;
  readonly status: (typeof ORDER_STATUSES)[number];
  readonly result: string;
}

export const MODALITIES = ['X-Ray', 'CT', 'MRI', 'Ultrasound'] as const;

export interface RadiologyRequest extends Entity {
  readonly patientId: string;
  readonly doctorId: string;
  readonly modality: (typeof MODALITIES)[number];
  readonly bodyPart: string;
  readonly requestedOn: string;
  readonly status: (typeof ORDER_STATUSES)[number];
  readonly report: string;
}
