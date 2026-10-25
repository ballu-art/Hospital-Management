import { Routes } from '@angular/router';

export const RADIOLOGY_ROUTES: Routes = [
  {
    path: '',
    title: 'Radiology',
    loadComponent: () => import('./pages/radiology.page').then((m) => m.RadiologyPage),
  },
];
