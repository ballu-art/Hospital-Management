import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/auth/auth.guard';

export const STAFF_ROUTES: Routes = [
  {
    path: '',
    title: 'Employees',
    canActivate: [permissionGuard('employees:read')],
    loadComponent: () => import('./pages/employees.page').then((m) => m.EmployeesPage),
  },
  {
    path: 'attendance',
    title: 'Attendance',
    data: { breadcrumb: 'Attendance' },
    canActivate: [permissionGuard('attendance:read')],
    loadComponent: () => import('./pages/attendance.page').then((m) => m.AttendancePage),
  },
  {
    path: 'leave',
    title: 'Leave',
    data: { breadcrumb: 'Leave' },
    canActivate: [permissionGuard('leave:read')],
    loadComponent: () => import('./pages/leave.page').then((m) => m.LeavePage),
  },
  {
    path: 'payroll',
    title: 'Payroll',
    data: { breadcrumb: 'Payroll' },
    canActivate: [permissionGuard('payroll:read')],
    loadComponent: () => import('./pages/payroll.page').then((m) => m.PayrollPage),
  },
];
