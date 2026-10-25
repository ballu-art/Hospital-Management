import { isoDaysFromToday as d } from '../../shared/utils/date';
import { AttendanceRecord, Employee, LeaveRequest, PayrollRecord } from '../models/hr';
import { depId, pad4 } from './mock-data';

export const eid = (n: number): string => `emp-${pad4(n)}`;

// first, last, designation, department#, monthly salary, status, years employed
const EMP_ROWS: [string, string, string, number, number, Employee['status'], number][] = [
  ['Nandini', 'Joshi', 'Head Nurse', 1, 3200, 'Active', 8],
  ['Carlos', 'Mendes', 'Staff Nurse', 2, 2600, 'Active', 4],
  ['Fatima', 'Sheikh', 'Staff Nurse', 6, 2600, 'Active', 3],
  ['Thomas', 'Weber', 'Laboratory Technician', 1, 2400, 'Active', 5],
  ['Anita', 'Pillai', 'Radiology Technician', 3, 2500, 'On leave', 6],
  ['Jonas', 'Larsen', 'Pharmacist', 1, 3000, 'Active', 7],
  ['Ritu', 'Sethi', 'HR Executive', 1, 2800, 'Active', 2],
  ['Miguel', 'Santos', 'Front Desk Coordinator', 1, 2000, 'Active', 1],
  ['Sana', 'Qureshi', 'Billing Specialist', 1, 2300, 'Active', 3],
  ['Peter', 'Novak', 'Store Keeper', 1, 2100, 'Active', 5],
  ['Lakshmi', 'Menon', 'Staff Nurse', 4, 2600, 'Active', 2],
  ['Ben', 'Carter', 'Ward Assistant', 3, 1800, 'Active', 1],
  ['Yuki', 'Tanaka', 'Physiotherapist', 3, 2700, 'Active', 4],
  ['Amara', 'Nwosu', 'Staff Nurse', 5, 2600, 'Inactive', 6],
];
export const MOCK_EMPLOYEES: readonly Employee[] = EMP_ROWS.map(
  ([firstName, lastName, designation, dep, monthlySalary, status, years], i) => ({
    id: eid(i + 1),
    employeeCode: `EMP-${String(i + 101)}`,
    firstName,
    lastName,
    designation,
    departmentId: depId(dep),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.test`,
    phone: `555-04${String(i + 10)}`,
    joinedOn: d(-365 * years - 20 * i),
    monthlySalary,
    status,
  }),
);

/** Deterministic attendance for today and the previous two days. */
export const MOCK_ATTENDANCE: readonly AttendanceRecord[] = [0, -1, -2].flatMap((offset, dayIdx) =>
  MOCK_EMPLOYEES.filter((e) => e.status !== 'Inactive').map((e, i) => {
    const n = Number(e.id.split('-')[1]);
    const status: AttendanceRecord['status'] =
      e.status === 'On leave'
        ? 'On leave'
        : (n + dayIdx) % 7 === 3
          ? 'Late'
          : (n * 3 + dayIdx) % 11 === 5
            ? 'Absent'
            : 'Present';
    const absent = status === 'Absent' || status === 'On leave';
    return {
      id: `att-${pad4(dayIdx * 20 + i + 1)}`,
      employeeId: e.id,
      date: d(offset),
      checkIn: absent ? '' : status === 'Late' ? '09:25' : '08:55',
      checkOut: absent || offset === 0 ? '' : '17:05',
      status,
    };
  }),
);

// employee#, type, start offset, end offset, reason, status
const LEAVE_ROWS: [
  number,
  LeaveRequest['leaveType'],
  number,
  number,
  string,
  LeaveRequest['status'],
][] = [
  [5, 'Sick', -3, 4, 'Recovery after minor procedure', 'Approved'],
  [2, 'Annual', 10, 14, 'Family event', 'Pending'],
  [8, 'Casual', 2, 2, 'Personal errand', 'Pending'],
  [11, 'Annual', 20, 27, 'Planned vacation', 'Pending'],
  [4, 'Sick', -12, -10, 'Seasonal flu', 'Approved'],
  [9, 'Unpaid', 30, 40, 'Extended personal leave', 'Rejected'],
  [12, 'Casual', 6, 6, 'Appointment', 'Approved'],
];
export const MOCK_LEAVES: readonly LeaveRequest[] = LEAVE_ROWS.map(
  ([e, leaveType, s, en, reason, status], i) => ({
    id: `lev-${pad4(i + 1)}`,
    employeeId: eid(e),
    leaveType,
    startDate: d(s),
    endDate: d(en),
    reason,
    status,
  }),
);

export function previousMonth(now: Date = new Date()): string {
  const p = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${String(p.getFullYear())}-${String(p.getMonth() + 1).padStart(2, '0')}`;
}

export function buildPayroll(employee: Employee, month: string): Omit<PayrollRecord, 'id'> {
  const basic = employee.monthlySalary;
  const allowances = Math.round(basic * 0.1);
  const deductions = Math.round(basic * 0.07);
  return {
    employeeId: employee.id,
    month,
    basic,
    allowances,
    deductions,
    netPay: basic + allowances - deductions,
    status: 'Draft',
  };
}

export const MOCK_PAYROLL: readonly PayrollRecord[] = MOCK_EMPLOYEES.filter(
  (e) => e.status !== 'Inactive',
).map((e, i) => ({
  ...buildPayroll(e, previousMonth()),
  id: `pay-${pad4(i + 1)}`,
  status: 'Paid' as const,
}));
