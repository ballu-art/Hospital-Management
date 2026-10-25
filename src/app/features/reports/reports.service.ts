import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Permission } from '../../core/auth/permissions';
import { employeeFullName } from '../../data-access/models/hr';
import { isExpiringSoon, isLowStock, EXPIRY_WARNING_DAYS } from '../../data-access/models/supply';
import { APPOINTMENT_REPOSITORY } from '../../data-access/repositories/appointment.repository';
import { BILL_REPOSITORY } from '../../data-access/repositories/bill.repository';
import { PATIENT_REPOSITORY } from '../../data-access/repositories/patient.repository';
import {
  ATTENDANCE_REPOSITORY,
  DEPARTMENT_REPOSITORY,
  EMPLOYEE_REPOSITORY,
  INVENTORY_REPOSITORY,
  MEDICINE_REPOSITORY,
} from '../../data-access/repositories/repository-tokens';
import { isoDaysFromToday } from '../../shared/utils/date';
import { formatMoney } from '../../shared/utils/format';

export interface Report {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly columns: readonly string[];
  readonly rows: readonly (string | number)[][];
}

interface ReportDef {
  readonly permission: Permission;
  readonly build: () => Observable<Report>;
}

/** Builds tabular reports from repositories. Only reports the role may read are returned. */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly auth = inject(AuthService);
  private readonly patients = inject(PATIENT_REPOSITORY);
  private readonly appointments = inject(APPOINTMENT_REPOSITORY);
  private readonly departments = inject(DEPARTMENT_REPOSITORY);
  private readonly bills = inject(BILL_REPOSITORY);
  private readonly medicines = inject(MEDICINE_REPOSITORY);
  private readonly inventory = inject(INVENTORY_REPOSITORY);
  private readonly employees = inject(EMPLOYEE_REPOSITORY);
  private readonly attendance = inject(ATTENDANCE_REPOSITORY);

  load(): Observable<readonly Report[]> {
    const defs = this.definitions().filter((d) => this.auth.can(d.permission));
    return defs.length ? forkJoin(defs.map((d) => d.build())) : of([]);
  }

  private definitions(): ReportDef[] {
    return [
      {
        permission: 'patients:read',
        build: () =>
          this.patients.all().pipe(
            map((list) => {
              const byMonth = new Map<string, number>();
              for (const p of list) {
                const month = p.registrationDate.slice(0, 7);
                byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
              }
              return {
                id: 'registrations',
                title: 'Patient registrations by month',
                description: 'New patients registered per month.',
                columns: ['Month', 'Registrations'],
                rows: [...byMonth.entries()]
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([m, c]) => [m, c]),
              };
            }),
          ),
      },
      {
        permission: 'appointments:read',
        build: () =>
          forkJoin({ appts: this.appointments.all(), deps: this.departments.all() }).pipe(
            map(({ appts, deps }) => ({
              id: 'appointments',
              title: 'Appointments by department',
              description: 'Appointment status counts per department.',
              columns: ['Department', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled'],
              rows: deps.map((d) => [
                d.name,
                ...(['Scheduled', 'Confirmed', 'Completed', 'Cancelled'] as const).map(
                  (s) => appts.filter((a) => a.departmentId === d.id && a.status === s).length,
                ),
              ]),
            })),
          ),
      },
      {
        permission: 'billing:read',
        build: () =>
          this.bills.all().pipe(
            map((list) => ({
              id: 'billing',
              title: 'Billing summary',
              description: 'Invoice totals by payment status.',
              columns: ['Status', 'Invoices', 'Billed', 'Collected', 'Outstanding'],
              rows: (['Paid', 'Partially paid', 'Unpaid'] as const).map((s) => {
                const rows = list.filter((b) => b.status === s);
                const billed = rows.reduce((t, b) => t + b.amount, 0);
                const paid = rows.reduce((t, b) => t + b.paidAmount, 0);
                return [
                  s,
                  rows.length,
                  formatMoney(billed),
                  formatMoney(paid),
                  formatMoney(billed - paid),
                ];
              }),
            })),
          ),
      },
      {
        permission: 'inventory:read',
        build: () =>
          forkJoin({ meds: this.medicines.all(), items: this.inventory.all() }).pipe(
            map(({ meds, items }) => {
              const limit = isoDaysFromToday(EXPIRY_WARNING_DAYS);
              return {
                id: 'stock-alerts',
                title: 'Stock alerts',
                description: `Items at or below reorder level and medicines expired or expiring within ${String(EXPIRY_WARNING_DAYS)} days.`,
                columns: ['Item', 'Type', 'Stock', 'Reorder level', 'Issue'],
                rows: [
                  ...meds
                    .filter(isLowStock)
                    .map((m) => [m.name, 'Medicine', m.stock, m.reorderLevel, 'Low stock']),
                  ...meds
                    .filter((m) => isExpiringSoon(m, limit))
                    .map((m) => [
                      m.name,
                      'Medicine',
                      m.stock,
                      m.reorderLevel,
                      `Expires ${m.expiryDate}`,
                    ]),
                  ...items
                    .filter(isLowStock)
                    .map((i) => [i.name, 'Supply', i.stock, i.reorderLevel, 'Low stock']),
                ],
              };
            }),
          ),
      },
      {
        permission: 'attendance:read',
        build: () =>
          forkJoin({ att: this.attendance.all(), emps: this.employees.all() }).pipe(
            map(({ att, emps }) => ({
              id: 'attendance',
              title: 'Attendance by employee',
              description: 'Recorded attendance statuses across the loaded period.',
              columns: ['Employee', 'Present', 'Late', 'Absent', 'On leave'],
              rows: emps
                .filter((e) => e.status !== 'Inactive')
                .map((e) => [
                  employeeFullName(e),
                  ...(['Present', 'Late', 'Absent', 'On leave'] as const).map(
                    (s) => att.filter((a) => a.employeeId === e.id && a.status === s).length,
                  ),
                ]),
            })),
          ),
      },
    ];
  }
}

/** CSV with protection against spreadsheet formula injection. */
export function toCsv(report: Report): string {
  const cell = (v: string | number): string => {
    let text = String(v);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [report.columns, ...report.rows].map((row) => row.map(cell).join(',')).join('\r\n');
}
