import { Role } from '../../data-access/models/user';

export const MODULE_KEYS = [
  'dashboard',
  'patients',
  'appointments',
  'doctors',
  'departments',
  'admissions',
  'billing',
  'pharmacy',
  'laboratory',
  'radiology',
  'inventory',
  'employees',
  'attendance',
  'leave',
  'payroll',
  'reports',
  'settings',
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export type Permission =
  `${ModuleKey}:read` | `${ModuleKey}:write` | 'clinical:write' | 'leave:approve';

const rw = (...modules: ModuleKey[]): Permission[] =>
  modules.flatMap((m) => [`${m}:read` as const, `${m}:write` as const]);
const ro = (...modules: ModuleKey[]): Permission[] => modules.map((m) => `${m}:read` as const);

/**
 * Demo role matrix based on the Hospital ERP requirements document.
 * This only shapes the UI; real authorization must be enforced by the backend.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  'super-admin': [...rw(...MODULE_KEYS), 'leave:approve'],
  'hr-manager': [
    ...ro('dashboard', 'doctors', 'departments', 'reports'),
    ...rw('employees', 'attendance', 'leave', 'payroll'),
    'leave:approve',
  ],
  doctor: [
    ...ro('dashboard', 'patients', 'doctors', 'departments', 'admissions'),
    ...rw('appointments', 'laboratory', 'radiology'),
    'clinical:write',
  ],
  'inventory-manager': [...ro('dashboard', 'reports'), ...rw('pharmacy', 'inventory')],
};

export const ROLE_DESCRIPTIONS: Readonly<Record<Role, string>> = {
  'super-admin': 'Manage users, view all reports, configure the system, register patients.',
  'hr-manager': 'Employee management, attendance, leave approval and payroll.',
  doctor: 'View patients, add diagnoses, prescriptions and medical notes.',
  'inventory-manager': 'Purchases, stock levels, vendors and pharmacy stock.',
};
