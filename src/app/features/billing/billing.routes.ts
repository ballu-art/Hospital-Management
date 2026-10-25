import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: '',
    title: 'Billing & payments',
    loadComponent: () => import('./pages/billing.page').then((m) => m.BillingPage),
  },
];
