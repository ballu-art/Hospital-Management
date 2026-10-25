import { Routes } from '@angular/router';

export const PHARMACY_ROUTES: Routes = [
  {
    path: '',
    title: 'Pharmacy',
    loadComponent: () => import('./pages/pharmacy.page').then((m) => m.PharmacyPage),
  },
];
