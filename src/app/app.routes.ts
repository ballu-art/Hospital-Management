import { Routes } from '@angular/router';
import { authGuard, permissionGuard } from './core/auth/auth.guard';

const notFound = {
  loadComponent: () => import('./core/error-handling/error.page').then((m) => m.ErrorPage),
};

/** Lazy feature route helper: guard + breadcrumb + lazy children. */
const feature = (
  path: string,
  breadcrumb: string,
  permission: Parameters<typeof permissionGuard>[0],
  loader: () => Promise<Routes>,
) => ({
  path,
  data: { breadcrumb },
  canActivate: [permissionGuard(permission)],
  loadChildren: loader,
});

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    loadComponent: () => import('./core/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'error',
    ...notFound,
    title: 'Application error',
    data: {
      code: 'Error',
      icon: 'report',
      heading: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again.',
    },
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      feature('dashboard', 'Dashboard', 'dashboard:read', () =>
        import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      ),
      feature('patients', 'Patients', 'patients:read', () =>
        import('./features/patients/patients.routes').then((m) => m.PATIENTS_ROUTES),
      ),
      feature('appointments', 'Appointments', 'appointments:read', () =>
        import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES),
      ),
      feature('doctors', 'Doctors', 'doctors:read', () =>
        import('./features/doctors/doctors.routes').then((m) => m.DOCTORS_ROUTES),
      ),
      feature('departments', 'Departments', 'departments:read', () =>
        import('./features/departments/departments.routes').then((m) => m.DEPARTMENTS_ROUTES),
      ),
      feature('admissions', 'Admissions', 'admissions:read', () =>
        import('./features/admissions/admissions.routes').then((m) => m.ADMISSIONS_ROUTES),
      ),
      feature('billing', 'Billing & payments', 'billing:read', () =>
        import('./features/billing/billing.routes').then((m) => m.BILLING_ROUTES),
      ),
      feature('pharmacy', 'Pharmacy', 'pharmacy:read', () =>
        import('./features/pharmacy/pharmacy.routes').then((m) => m.PHARMACY_ROUTES),
      ),
      feature('laboratory', 'Laboratory', 'laboratory:read', () =>
        import('./features/laboratory/laboratory.routes').then((m) => m.LABORATORY_ROUTES),
      ),
      feature('radiology', 'Radiology', 'radiology:read', () =>
        import('./features/radiology/radiology.routes').then((m) => m.RADIOLOGY_ROUTES),
      ),
      feature('inventory', 'Inventory', 'inventory:read', () =>
        import('./features/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
      ),
      {
        path: 'staff',
        data: { breadcrumb: 'Staff' },
        loadChildren: () => import('./features/staff/staff.routes').then((m) => m.STAFF_ROUTES),
      },
      feature('reports', 'Reports & analytics', 'reports:read', () =>
        import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      ),
      feature('settings', 'Settings', 'settings:read', () =>
        import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      ),
      {
        path: 'forbidden',
        ...notFound,
        title: 'Access denied',
        data: {
          code: '403',
          icon: 'lock',
          heading: 'Access denied',
          message:
            'Your demo role does not include this area. (Real access control must be enforced by the backend.)',
        },
      },
      {
        path: '**',
        ...notFound,
        title: 'Page not found',
        data: {
          code: '404',
          icon: 'search_off',
          heading: 'Page not found',
          message: 'The page you requested does not exist or has moved.',
        },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
