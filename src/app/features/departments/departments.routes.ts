import { Routes } from '@angular/router';

export const DEPARTMENTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Departments',
    loadComponent: () => import('./pages/departments.page').then((m) => m.DepartmentsPage),
  },
];
