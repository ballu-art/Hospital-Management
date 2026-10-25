import { Routes } from '@angular/router';

export const DOCTORS_ROUTES: Routes = [
  {
    path: '',
    title: 'Doctors',
    loadComponent: () => import('./pages/doctors.page').then((m) => m.DoctorsPage),
  },
];
