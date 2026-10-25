import { Routes } from '@angular/router';

export const LABORATORY_ROUTES: Routes = [
  {
    path: '',
    title: 'Laboratory',
    loadComponent: () => import('./pages/laboratory.page').then((m) => m.LaboratoryPage),
  },
];
