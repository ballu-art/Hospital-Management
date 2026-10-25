import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    title: 'Hospital settings',
    loadComponent: () =>
      import('./pages/hospital-settings.page').then((m) => m.HospitalSettingsPage),
  },
  {
    path: 'users',
    title: 'Users',
    data: { breadcrumb: 'Users' },
    loadComponent: () => import('./pages/users.page').then((m) => m.UsersPage),
  },
  {
    path: 'roles',
    title: 'Roles & permissions',
    data: { breadcrumb: 'Roles & permissions' },
    loadComponent: () => import('./pages/roles.page').then((m) => m.RolesPage),
  },
];
