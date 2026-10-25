import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';
import { APPOINTMENT_REPOSITORY } from '../repositories/appointment.repository';
import { BILL_REPOSITORY } from '../repositories/bill.repository';
import { CLINICAL_RECORD_REPOSITORY } from '../repositories/clinical-record.repository';
import { PATIENT_REPOSITORY } from '../repositories/patient.repository';
import * as T from '../repositories/repository-tokens';
import { InMemoryRepository } from './in-memory.repository';
import { MOCK_DEPARTMENTS, MOCK_DOCTORS } from './mock-data';
import { MOCK_ATTENDANCE, MOCK_EMPLOYEES, MOCK_LEAVES, MOCK_PAYROLL } from './mock-data-hr';
import { MOCK_ADMISSIONS, MOCK_BEDS, MOCK_LAB_ORDERS, MOCK_RADIOLOGY } from './mock-data-ops';
import {
  MOCK_INVENTORY,
  MOCK_MEDICINES,
  MOCK_PURCHASE_ORDERS,
  MOCK_SUPPLIERS,
  MOCK_USERS,
} from './mock-data-supply';
import { MockAppointmentRepository } from './mock-appointment.repository';
import { MockPatientRepository } from './mock-patient.repository';
import { MockBillRepository, MockClinicalRecordRepository } from './mock-simple.repositories';

/** Standard in-memory repository for modules that only need basic CRUD. */
function simple<T extends { id: string }>(
  token: { toString(): string },
  seed: readonly T[],
  idPrefix: string,
  searchText: (item: T) => string,
): Provider {
  return {
    provide: token,
    useFactory: () => new InMemoryRepository<T>(seed, { idPrefix, searchText }),
  };
}

/**
 * Registers mock repositories. To use a real API, register an HTTP implementation for the same
 * token instead (see README, "Replacing a mock repository").
 */
export function provideMockRepositories(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PATIENT_REPOSITORY, useClass: MockPatientRepository },
    { provide: APPOINTMENT_REPOSITORY, useClass: MockAppointmentRepository },
    { provide: CLINICAL_RECORD_REPOSITORY, useClass: MockClinicalRecordRepository },
    { provide: BILL_REPOSITORY, useClass: MockBillRepository },
    simple(
      T.DOCTOR_REPOSITORY,
      MOCK_DOCTORS,
      'doc',
      (d) => `${d.firstName} ${d.lastName} ${d.specialization} ${d.email}`,
    ),
    simple(T.DEPARTMENT_REPOSITORY, MOCK_DEPARTMENTS, 'dep', (d) => `${d.name} ${d.location}`),
    simple(
      T.ADMISSION_REPOSITORY,
      MOCK_ADMISSIONS,
      'adm',
      (a) => `${a.id} ${a.diagnosis} ${a.patientId} ${a.type}`,
    ),
    simple(T.BED_REPOSITORY, MOCK_BEDS, 'bed', (b) => `${b.ward} ${b.number} ${b.type}`),
    simple(
      T.LAB_ORDER_REPOSITORY,
      MOCK_LAB_ORDERS,
      'lab',
      (l) => `${l.test} ${l.patientId} ${l.status}`,
    ),
    simple(
      T.RADIOLOGY_REPOSITORY,
      MOCK_RADIOLOGY,
      'rad',
      (r) => `${r.modality} ${r.bodyPart} ${r.patientId}`,
    ),
    simple(T.MEDICINE_REPOSITORY, MOCK_MEDICINES, 'med', (m) => `${m.name} ${m.category}`),
    simple(
      T.INVENTORY_REPOSITORY,
      MOCK_INVENTORY,
      'inv',
      (i) => `${i.name} ${i.category} ${i.location}`,
    ),
    simple(
      T.SUPPLIER_REPOSITORY,
      MOCK_SUPPLIERS,
      'sup',
      (s) => `${s.name} ${s.contactPerson} ${s.email}`,
    ),
    simple(
      T.PURCHASE_ORDER_REPOSITORY,
      MOCK_PURCHASE_ORDERS,
      'po',
      (p) => `${p.orderNumber} ${p.itemsSummary}`,
    ),
    simple(
      T.EMPLOYEE_REPOSITORY,
      MOCK_EMPLOYEES,
      'emp',
      (e) => `${e.firstName} ${e.lastName} ${e.employeeCode} ${e.designation}`,
    ),
    simple(
      T.ATTENDANCE_REPOSITORY,
      MOCK_ATTENDANCE,
      'att',
      (a) => `${a.employeeId} ${a.date} ${a.status}`,
    ),
    simple(
      T.LEAVE_REPOSITORY,
      MOCK_LEAVES,
      'lev',
      (l) => `${l.employeeId} ${l.leaveType} ${l.reason}`,
    ),
    simple(
      T.PAYROLL_REPOSITORY,
      MOCK_PAYROLL,
      'pay',
      (p) => `${p.employeeId} ${p.month} ${p.status}`,
    ),
    simple(T.USER_REPOSITORY, MOCK_USERS, 'usr', (u) => `${u.name} ${u.email} ${u.role}`),
  ]);
}
