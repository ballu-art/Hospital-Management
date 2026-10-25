import { Permission } from '../auth/permissions';

export interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly route?: string;
  readonly permission?: Permission;
  readonly children?: readonly NavItem[];
}

/** Sidebar structure. Items are hidden when the signed-in demo role lacks the permission. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', permission: 'dashboard:read' },
  {
    label: 'Patient Management',
    icon: 'personal_injury',
    children: [
      { label: 'Patients', icon: 'groups', route: '/patients', permission: 'patients:read' },
      {
        label: 'Register patient',
        icon: 'person_add',
        route: '/patients/new',
        permission: 'patients:write',
      },
    ],
  },
  { label: 'Appointments', icon: 'event', route: '/appointments', permission: 'appointments:read' },
  { label: 'Doctors', icon: 'stethoscope', route: '/doctors', permission: 'doctors:read' },
  {
    label: 'Departments',
    icon: 'apartment',
    route: '/departments',
    permission: 'departments:read',
  },
  {
    label: 'Admissions & Beds',
    icon: 'hotel',
    children: [
      {
        label: 'OPD / IPD visits',
        icon: 'assignment_ind',
        route: '/admissions',
        permission: 'admissions:read',
      },
      { label: 'Beds', icon: 'bed', route: '/admissions/beds', permission: 'admissions:read' },
    ],
  },
  {
    label: 'Billing & Payments',
    icon: 'receipt_long',
    route: '/billing',
    permission: 'billing:read',
  },
  { label: 'Pharmacy', icon: 'medication', route: '/pharmacy', permission: 'pharmacy:read' },
  { label: 'Laboratory', icon: 'biotech', route: '/laboratory', permission: 'laboratory:read' },
  { label: 'Radiology', icon: 'radiology', route: '/radiology', permission: 'radiology:read' },
  {
    label: 'Inventory & Suppliers',
    icon: 'inventory_2',
    children: [
      {
        label: 'Stock items',
        icon: 'inventory',
        route: '/inventory',
        permission: 'inventory:read',
      },
      {
        label: 'Suppliers',
        icon: 'local_shipping',
        route: '/inventory/suppliers',
        permission: 'inventory:read',
      },
      {
        label: 'Purchase orders',
        icon: 'shopping_cart',
        route: '/inventory/purchase-orders',
        permission: 'inventory:read',
      },
    ],
  },
  {
    label: 'Staff Management',
    icon: 'badge',
    children: [
      { label: 'Employees', icon: 'people', route: '/staff', permission: 'employees:read' },
      {
        label: 'Attendance',
        icon: 'event_available',
        route: '/staff/attendance',
        permission: 'attendance:read',
      },
      { label: 'Leave', icon: 'beach_access', route: '/staff/leave', permission: 'leave:read' },
      { label: 'Payroll', icon: 'payments', route: '/staff/payroll', permission: 'payroll:read' },
    ],
  },
  {
    label: 'Reports & Analytics',
    icon: 'analytics',
    route: '/reports',
    permission: 'reports:read',
  },
  {
    label: 'Settings',
    icon: 'settings',
    children: [
      {
        label: 'Hospital profile',
        icon: 'domain',
        route: '/settings',
        permission: 'settings:read',
      },
      {
        label: 'Users',
        icon: 'manage_accounts',
        route: '/settings/users',
        permission: 'settings:read',
      },
      {
        label: 'Roles & permissions',
        icon: 'admin_panel_settings',
        route: '/settings/roles',
        permission: 'settings:read',
      },
    ],
  },
];
