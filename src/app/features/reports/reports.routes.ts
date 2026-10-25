import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Reports & analytics',
    loadComponent: () => import('./reports.page').then((m) => m.ReportsPage),
  },
];
