import { Entity } from '../../shared/models/entity';

export const EMPLOYEE_STATUSES = ['Active', 'On leave', 'Inactive'] as const;

export interface Employee extends Entity {
  readonly employeeCode: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly designation: string;
  readonly departmentId: string;
  readonly email: string;
  readonly phone: string;
  readonly joinedOn: string;
  /** Fictional monthly base salary. */
  readonly monthlySalary: number;
  readonly status: (typeof EMPLOYEE_STATUSES)[number];
}

export function employeeFullName(e: Pick<Employee, 'firstName' | 'lastName'>): string {
  return `${e.firstName} ${e.lastName}`;
}

export const ATTENDANCE_STATUSES = ['Present', 'Late', 'Absent', 'On leave'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface AttendanceRecord extends Entity {
  readonly employeeId: string;
  readonly date: string;
  readonly checkIn: string;
  readonly checkOut: string;
  readonly status: AttendanceStatus;
}

export const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Unpaid'] as const;
export const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected'] as const;

export interface LeaveRequest extends Entity {
  readonly employeeId: string;
  readonly leaveType: (typeof LEAVE_TYPES)[number];
  readonly startDate: string;
  readonly endDate: string;
  readonly reason: string;
  readonly status: (typeof LEAVE_STATUSES)[number];
}

export const PAYROLL_STATUSES = ['Draft', 'Processed', 'Paid'] as const;

export interface PayrollRecord extends Entity {
  readonly employeeId: string;
  /** Pay period, YYYY-MM. */
  readonly month: string;
  readonly basic: number;
  readonly allowances: number;
  readonly deductions: number;
  readonly netPay: number;
  readonly status: (typeof PAYROLL_STATUSES)[number];
}
