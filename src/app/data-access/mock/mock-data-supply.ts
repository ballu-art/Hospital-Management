import { isoDaysFromToday as d } from '../../shared/utils/date';
import { InventoryItem, Medicine, PurchaseOrder, Supplier } from '../models/supply';
import { AppUser } from '../models/user';
import { pad4 } from './mock-data';

const sid = (n: number): string => `sup-${pad4(n)}`;

export const MOCK_SUPPLIERS: readonly Supplier[] = [
  ['MediSource Distributors', 'Helen Park', 'orders@medisource.example.test'],
  ['CareLine Pharma', 'Joaquin Ruiz', 'sales@careline.example.test'],
  ['SterilePro Supplies', 'Nora Evans', 'hello@sterilepro.example.test'],
  ['Apex Medical Devices', 'Ibrahim Sule', 'contact@apexmed.example.test'],
  ['GreenLeaf Consumables', 'Mina Kovacs', 'info@greenleaf.example.test'],
  ['Northwind Lab Supply', 'Oscar Lind', 'lab@northwind.example.test'],
].map(([name, contactPerson, email], i) => ({
  id: sid(i + 1),
  name,
  contactPerson,
  phone: `555-05${String(i + 10)}`,
  email,
  status: i === 4 ? ('Inactive' as const) : ('Active' as const),
}));

// name, category, stock, reorder level, unit price, expiry offset (days), supplier#
const MED_ROWS: [string, string, number, number, number, number, number][] = [
  ['Paracetamol 500 mg', 'Analgesic', 820, 200, 0.1, 420, 2],
  ['Amoxicillin 250 mg', 'Antibiotic', 140, 150, 0.4, 210, 2],
  ['Atorvastatin 10 mg', 'Cardiovascular', 460, 120, 0.3, 300, 1],
  ['Insulin glargine (vial)', 'Endocrine', 35, 40, 18, 55, 1],
  ['Salbutamol inhaler', 'Respiratory', 60, 30, 6.5, 40, 2],
  ['Ondansetron 4 mg', 'Antiemetic', 300, 80, 0.5, 180, 2],
  ['Normal saline 500 ml', 'IV fluid', 90, 100, 1.2, 365, 3],
  ['Aspirin 75 mg', 'Cardiovascular', 640, 150, 0.05, 25, 1],
  ['Metformin 500 mg', 'Endocrine', 520, 150, 0.12, 240, 1],
  ['Cetirizine 10 mg', 'Antihistamine', 210, 60, 0.08, 150, 2],
  ['Heparin 5000 IU', 'Anticoagulant', 48, 50, 4.2, 75, 3],
  ['Omeprazole 20 mg', 'Gastrointestinal', 380, 100, 0.2, 330, 2],
];
export const MOCK_MEDICINES: readonly Medicine[] = MED_ROWS.map(
  ([name, category, stock, reorderLevel, unitPrice, expiry, sup], i) => ({
    id: `med-${pad4(i + 1)}`,
    name,
    category,
    stock,
    reorderLevel,
    unitPrice,
    expiryDate: d(expiry),
    supplierId: sid(sup),
  }),
);

// name, category, stock, reorder level, unit, location, supplier#
const INV_ROWS: [string, string, number, number, string, string, number][] = [
  ['Disposable gloves (box)', 'Consumables', 40, 60, 'box', 'Main store', 5],
  ['Surgical masks (box)', 'Consumables', 120, 50, 'box', 'Main store', 5],
  ['Syringes 5 ml (pack)', 'Consumables', 200, 80, 'pack', 'Main store', 3],
  ['IV cannula 20G (box)', 'Consumables', 25, 30, 'box', 'Main store', 3],
  ['Gauze rolls', 'Dressings', 300, 100, 'roll', 'Ward store', 3],
  ['ECG electrodes (pack)', 'Cardiology', 55, 40, 'pack', 'Cardiology store', 4],
  ['Pulse oximeter', 'Equipment', 12, 8, 'unit', 'Equipment room', 4],
  ['Blood collection tubes', 'Laboratory', 900, 400, 'tube', 'Lab store', 6],
  ['Reagent kit – CBC', 'Laboratory', 6, 10, 'kit', 'Lab store', 6],
  ['Bed linen sets', 'Housekeeping', 80, 50, 'set', 'Linen room', 5],
];
export const MOCK_INVENTORY: readonly InventoryItem[] = INV_ROWS.map(
  ([name, category, stock, reorderLevel, unit, location, sup], i) => ({
    id: `inv-${pad4(i + 1)}`,
    name,
    category,
    stock,
    reorderLevel,
    unit,
    location,
    supplierId: sid(sup),
  }),
);

// supplier#, ordered offset, expected offset, summary, total, status
const PO_ROWS: [number, number, number, string, number, PurchaseOrder['status']][] = [
  [1, -12, -5, 'Atorvastatin, aspirin, insulin', 2400, 'Received'],
  [2, -4, 3, 'Amoxicillin, salbutamol inhalers', 1850, 'Ordered'],
  [5, -2, 5, 'Gloves and masks', 960, 'Ordered'],
  [6, 0, 7, 'Reagent kits – CBC', 1320, 'Draft'],
  [3, -20, -14, 'Saline, syringes, cannulas', 1480, 'Received'],
  [4, -30, -25, 'ECG electrodes', 410, 'Cancelled'],
];
export const MOCK_PURCHASE_ORDERS: readonly PurchaseOrder[] = PO_ROWS.map(
  ([sup, ordered, expected, itemsSummary, total, status], i) => ({
    id: `po-${pad4(i + 1)}`,
    orderNumber: `PO-${String(new Date().getFullYear())}-${String(i + 1).padStart(3, '0')}`,
    supplierId: sid(sup),
    orderedOn: d(ordered),
    expectedOn: d(expected),
    itemsSummary,
    total,
    status,
  }),
);

/** Demo accounts. There are no passwords: the login screen is a role picker. */
export const MOCK_USERS: readonly AppUser[] = [
  ['Asha Verma', 'asha.verma@example.test', 'super-admin', 'Active'],
  ['Ritu Sethi', 'ritu.sethi@example.test', 'hr-manager', 'Active'],
  ['Dr. Rohan Kapoor', 'rohan.kapoor@example.test', 'doctor', 'Active'],
  ['Peter Novak', 'peter.novak@example.test', 'inventory-manager', 'Active'],
  ['Dr. Priya Nair', 'priya.nair@example.test', 'doctor', 'Active'],
  ['Temp Auditor', 'auditor@example.test', 'hr-manager', 'Disabled'],
].map(([name, email, role, status], i) => ({
  id: `usr-${pad4(i + 1)}`,
  name,
  email,
  role: role as AppUser['role'],
  status: status as AppUser['status'],
}));
