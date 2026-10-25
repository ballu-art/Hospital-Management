import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/auth/auth.guard';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Patients',
    loadComponent: () => import('./pages/patient-list.page').then((m) => m.PatientListPage),
  },
  {
    path: 'new',
    title: 'Register patient',
    data: { breadcrumb: 'Register patient' },
    canActivate: [permissionGuard('patients:write')],
    loadComponent: () => import('./pages/patient-form.page').then((m) => m.PatientFormPage),
  },
  {
    path: ':id',
    title: 'Patient details',
    data: { breadcrumb: 'Patient details' },
    loadComponent: () => import('./pages/patient-detail.page').then((m) => m.PatientDetailPage),
  },
  {
    path: ':id/edit',
    title: 'Edit patient',
    data: { breadcrumb: 'Edit patient' },
    canActivate: [permissionGuard('patients:write')],
    loadComponent: () => import('./pages/patient-form.page').then((m) => m.PatientFormPage),
  },
];
