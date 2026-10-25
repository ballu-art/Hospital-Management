import { Routes } from '@angular/router';

export const ADMISSIONS_ROUTES: Routes = [
  {
    path: '',
    title: 'OPD / IPD visits',
    loadComponent: () => import('./pages/admissions.page').then((m) => m.AdmissionsPage),
  },
  {
    path: 'beds',
    title: 'Beds',
    data: { breadcrumb: 'Beds' },
    loadComponent: () => import('./pages/beds.page').then((m) => m.BedsPage),
  },
];
