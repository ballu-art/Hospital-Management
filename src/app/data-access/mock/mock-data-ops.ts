import { isoDaysFromToday as d } from '../../shared/utils/date';
import {
  Admission,
  Bed,
  Bill,
  LabOrder,
  RadiologyRequest,
  billStatusOf,
} from '../models/operations';
import { MOCK_DOCTORS, did, pad4, pid } from './mock-data';

const bedId = (n: number): string => `bed-${pad4(n)}`;

// ward, number prefix, type, count
const WARDS: [string, string, Bed['type'], number][] = [
  ['General Ward A', 'A', 'General', 6],
  ['Private Wing', 'P', 'Private', 4],
  ['Intensive Care', 'ICU', 'ICU', 4],
  ['General Ward B', 'B', 'General', 2],
];
const OCCUPIED = new Set([1, 3, 6, 11]);
const MAINTENANCE = new Set([16]);
export const MOCK_BEDS: readonly Bed[] = WARDS.flatMap(([ward, prefix, type, count]) =>
  Array.from({ length: count }, (_, i) => ({ ward, prefix, type, i })),
).map(({ ward, prefix, type, i }, idx) => ({
  id: bedId(idx + 1),
  ward,
  number: `${prefix}-${String(i + 1).padStart(2, '0')}`,
  type,
  status: OCCUPIED.has(idx + 1)
    ? 'Occupied'
    : MAINTENANCE.has(idx + 1)
      ? 'Maintenance'
      : 'Available',
}));

// patient#, doctor#, type, admitted offset, discharged offset (or null), bed#, diagnosis
const ADMISSION_ROWS: [number, number, Admission['type'], number, number | null, number, string][] =
  [
    [1, 2, 'IPD', -4, null, 3, 'Acute coronary syndrome'],
    [6, 3, 'IPD', -2, null, 6, 'Distal radius fracture'],
    [4, 8, 'IPD', -3, null, 11, 'Arrhythmia monitoring'],
    [13, 1, 'IPD', -2, null, 1, 'Severe dehydration'],
    [11, 8, 'IPD', -9, -6, 0, 'Atrial ectopy observation'],
    [14, 5, 'IPD', -8, -5, 0, 'Postnatal care'],
    [2, 4, 'OPD', 0, null, 0, 'Viral fever'],
    [3, 3, 'OPD', 0, null, 0, 'Knee pain'],
    [7, 5, 'OPD', -1, -1, 0, 'Prenatal consultation'],
  ];
export const MOCK_ADMISSIONS: readonly Admission[] = ADMISSION_ROWS.map(
  ([p, doc, type, adm, dis, bed, diagnosis], i) => ({
    id: `adm-${pad4(i + 1)}`,
    patientId: pid(p),
    doctorId: did(doc),
    departmentId: MOCK_DOCTORS[doc - 1].departmentId,
    type,
    admittedOn: d(adm),
    dischargedOn: dis === null ? '' : d(dis),
    bedId: bed ? bedId(bed) : '',
    diagnosis,
    status: dis === null ? 'Open' : 'Discharged',
  }),
);

// patient#, description, issued offset, due offset, amount, paid
const BILL_ROWS: [number, string, number, number, number, number][] = [
  [1, 'Cardiology consultation and ECG', -30, -16, 340, 340],
  [1, 'Inpatient stay – cardiac unit', -4, 10, 4200, 1000],
  [2, 'Pediatric consultation', -1, 13, 70, 0],
  [3, 'Orthopedic consultation and imaging', -20, -6, 410, 410],
  [4, 'Cardiac screening package', -14, 0, 560, 300],
  [5, 'Neurology consultation', -3, 11, 130, 0],
  [6, 'Fracture care and cast', -10, 4, 780, 780],
  [7, 'Prenatal consultation', -1, 13, 90, 90],
  [8, 'Annual health check-up', -1, 13, 320, 0],
  [11, 'Holter monitoring', -7, 7, 450, 450],
  [13, 'Inpatient stay – general ward', -2, 12, 1800, 0],
  [10, 'Vaccination', -2, 12, 60, 60],
];
export const MOCK_BILLS: readonly Bill[] = BILL_ROWS.map(
  ([p, description, issued, due, amount, paidAmount], i) => ({
    id: `bil-${pad4(i + 1)}`,
    invoiceNumber: `INV-${String(new Date().getFullYear())}-${String(i + 1).padStart(4, '0')}`,
    patientId: pid(p),
    description,
    issuedOn: d(issued),
    dueOn: d(due),
    amount,
    paidAmount,
    status: billStatusOf(amount, paidAmount),
  }),
);

// patient#, doctor#, test, priority, offset, status, result
const LAB_ROWS: [
  number,
  number,
  string,
  LabOrder['priority'],
  number,
  LabOrder['status'],
  string,
][] = [
  [
    1,
    2,
    'Lipid profile',
    'Routine',
    -2,
    'Completed',
    'LDL slightly elevated; other values in range.',
  ],
  [2, 4, 'Complete blood count', 'Urgent', 0, 'In progress', ''],
  [3, 3, 'Uric acid', 'Routine', -5, 'Completed', 'Within normal range.'],
  [4, 8, 'Troponin', 'Urgent', -3, 'Completed', 'Negative.'],
  [5, 7, 'Thyroid panel', 'Routine', 0, 'Ordered', ''],
  [8, 1, 'HbA1c', 'Routine', -1, 'In progress', ''],
  [11, 8, 'Electrolytes', 'Routine', -7, 'Completed', 'Normal.'],
  [13, 1, 'Renal function', 'Urgent', -2, 'Completed', 'Mild prerenal pattern; improving.'],
];
export const MOCK_LAB_ORDERS: readonly LabOrder[] = LAB_ROWS.map(
  ([p, doc, test, priority, offset, status, result], i) => ({
    id: `lab-${pad4(i + 1)}`,
    patientId: pid(p),
    doctorId: did(doc),
    test,
    priority,
    orderedOn: d(offset),
    status,
    result,
  }),
);

// patient#, doctor#, modality, body part, offset, status, report
const RAD_ROWS: [
  number,
  number,
  RadiologyRequest['modality'],
  string,
  number,
  RadiologyRequest['status'],
  string,
][] = [
  [3, 3, 'X-Ray', 'Left knee', -20, 'Completed', 'Mild joint-space narrowing. No acute fracture.'],
  [6, 3, 'X-Ray', 'Right wrist', -10, 'Completed', 'Distal radius fracture, minimal displacement.'],
  [5, 7, 'MRI', 'Brain', 0, 'Ordered', ''],
  [1, 2, 'Ultrasound', 'Heart (echo)', -4, 'In progress', ''],
  [
    7,
    5,
    'Ultrasound',
    'Obstetric',
    -1,
    'Completed',
    'Single live intrauterine pregnancy; growth appropriate.',
  ],
  [12, 8, 'CT', 'Chest', -1, 'Ordered', ''],
];
export const MOCK_RADIOLOGY: readonly RadiologyRequest[] = RAD_ROWS.map(
  ([p, doc, modality, bodyPart, offset, status, report], i) => ({
    id: `rad-${pad4(i + 1)}`,
    patientId: pid(p),
    doctorId: did(doc),
    modality,
    bodyPart,
    requestedOn: d(offset),
    status,
    report,
  }),
);
