import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Appointment, doctorFullName } from '../../../data-access/models/appointment';
import { Patient, patientFullName } from '../../../data-access/models/patient';
import { APPOINTMENT_REPOSITORY } from '../../../data-access/repositories/appointment.repository';
import { BILL_REPOSITORY } from '../../../data-access/repositories/bill.repository';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
import {
  ADMISSION_REPOSITORY,
  ATTENDANCE_REPOSITORY,
  BED_REPOSITORY,
  DEPARTMENT_REPOSITORY,
  DOCTOR_REPOSITORY,
  EMPLOYEE_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import { addDays, fromIsoDate, isoDaysFromToday, toIsoDate } from '../../../shared/utils/date';

export interface RecentAppointment {
  readonly id: string;
  readonly patientName: string;
  readonly doctorName: string;
  readonly date: string;
  readonly time: string;
  readonly status: Appointment['status'];
}

export interface DepartmentSummary {
  readonly name: string;
  readonly doctors: number;
  readonly appointmentsToday: number;
  readonly inpatients: number;
}

export interface DashboardData {
  readonly activePatients: number;
  readonly totalPatients: number;
  readonly todayAppointments: number;
  readonly todayCompleted: number;
  readonly availableDoctors: number;
  readonly totalDoctors: number;
  readonly bedsOccupied: number;
  readonly bedsAvailable: number;
  readonly bedsTotal: number;
  readonly collected30d: number;
  readonly outstanding: number;
  readonly outstandingBills: number;
  readonly totalEmployees: number;
  readonly attendanceToday: { present: number; late: number; absent: number; onLeave: number };
  readonly appointmentTrend: { labels: string[]; booked: number[]; cancelled: number[] };
  readonly visitTrend: { labels: string[]; visits: number[] };
  readonly recentAppointments: RecentAppointment[];
  readonly recentPatients: Patient[];
  readonly departments: DepartmentSummary[];
}

const dayLabel = (iso: string): string =>
  fromIsoDate(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });

/** Aggregates dashboard figures from repositories, skipping data the role cannot read. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly auth = inject(AuthService);
  private readonly patients = inject(PATIENT_REPOSITORY);
  private readonly appointments = inject(APPOINTMENT_REPOSITORY);
  private readonly bills = inject(BILL_REPOSITORY);
  private readonly doctors = inject(DOCTOR_REPOSITORY);
  private readonly departments = inject(DEPARTMENT_REPOSITORY);
  private readonly admissions = inject(ADMISSION_REPOSITORY);
  private readonly beds = inject(BED_REPOSITORY);
  private readonly employees = inject(EMPLOYEE_REPOSITORY);
  private readonly attendance = inject(ATTENDANCE_REPOSITORY);

  load(now: Date = new Date()): Observable<DashboardData> {
    const guard = <T>(allowed: boolean, source: Observable<readonly T[]>) =>
      allowed ? source : of([] as readonly T[]);
    const can = (p: Parameters<AuthService['can']>[0]) => this.auth.can(p);

    return forkJoin({
      patients: guard(can('patients:read'), this.patients.all()),
      appointments: guard(can('appointments:read'), this.appointments.all()),
      bills: guard(can('billing:read'), this.bills.all()),
      doctors: this.doctors.all(),
      departments: this.departments.all(),
      admissions: guard(can('admissions:read'), this.admissions.all()),
      beds: guard(can('admissions:read'), this.beds.all()),
      employees: guard(can('employees:read'), this.employees.all()),
      attendance: guard(can('attendance:read'), this.attendance.all()),
    }).pipe(
      map((d) => {
        const today = toIsoDate(now);
        const since = isoDaysFromToday(-30, now);
        const patientName = new Map(d.patients.map((p) => [p.id, patientFullName(p)]));
        const doctorName = new Map(d.doctors.map((x) => [x.id, doctorFullName(x)]));
        const todays = d.appointments.filter((a) => a.date === today);
        const openBills = d.bills.filter((b) => b.paidAmount < b.amount);
        const att = d.attendance.filter((a) => a.date === today);
        const count = (s: string) => att.filter((a) => a.status === s).length;

        const trendDays = Array.from({ length: 7 }, (_, i) => toIsoDate(addDays(now, i - 3)));
        const visitDays = Array.from({ length: 7 }, (_, i) => toIsoDate(addDays(now, i - 6)));

        return {
          activePatients: d.patients.filter((p) => p.status === 'Active').length,
          totalPatients: d.patients.length,
          todayAppointments: todays.filter((a) => a.status !== 'Cancelled').length,
          todayCompleted: todays.filter((a) => a.status === 'Completed').length,
          availableDoctors: d.doctors.filter((x) => x.status === 'Available').length,
          totalDoctors: d.doctors.length,
          bedsOccupied: d.beds.filter((b) => b.status === 'Occupied').length,
          bedsAvailable: d.beds.filter((b) => b.status === 'Available').length,
          bedsTotal: d.beds.length,
          collected30d: d.bills
            .filter((b) => b.issuedOn >= since)
            .reduce((s, b) => s + b.paidAmount, 0),
          outstanding: openBills.reduce((s, b) => s + b.amount - b.paidAmount, 0),
          outstandingBills: openBills.length,
          totalEmployees: d.employees.filter((e) => e.status !== 'Inactive').length,
          attendanceToday: {
            present: count('Present'),
            late: count('Late'),
            absent: count('Absent'),
            onLeave: count('On leave'),
          },
          appointmentTrend: {
            labels: trendDays.map(dayLabel),
            booked: trendDays.map(
              (day) =>
                d.appointments.filter((a) => a.date === day && a.status !== 'Cancelled').length,
            ),
            cancelled: trendDays.map(
              (day) =>
                d.appointments.filter((a) => a.date === day && a.status === 'Cancelled').length,
            ),
          },
          visitTrend: {
            labels: visitDays.map(dayLabel),
            visits: visitDays.map(
              (day) =>
                d.appointments.filter((a) => a.date === day && a.status === 'Completed').length +
                d.admissions.filter((a) => a.admittedOn === day).length,
            ),
          },
          recentAppointments: [...d.appointments]
            .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
            .filter((a) => a.date <= today)
            .slice(0, 5)
            .map((a) => ({
              id: a.id,
              patientName: patientName.get(a.patientId) ?? '—',
              doctorName: doctorName.get(a.doctorId) ?? '—',
              date: a.date,
              time: a.time,
              status: a.status,
            })),
          recentPatients: [...d.patients]
            .sort((a, b) => b.registrationDate.localeCompare(a.registrationDate))
            .slice(0, 5),
          departments: d.departments.map((dep) => ({
            name: dep.name,
            doctors: d.doctors.filter((x) => x.departmentId === dep.id).length,
            appointmentsToday: todays.filter(
              (a) => a.departmentId === dep.id && a.status !== 'Cancelled',
            ).length,
            inpatients: d.admissions.filter(
              (a) => a.departmentId === dep.id && a.type === 'IPD' && a.status === 'Open',
            ).length,
          })),
        } satisfies DashboardData;
      }),
    );
  }
}
