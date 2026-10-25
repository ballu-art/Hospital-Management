import { InjectionToken } from '@angular/core';
import { Department, Doctor } from '../models/appointment';
import { Admission, Bed, LabOrder, RadiologyRequest } from '../models/operations';
import { AttendanceRecord, Employee, LeaveRequest, PayrollRecord } from '../models/hr';
import { InventoryItem, Medicine, PurchaseOrder, Supplier } from '../models/supply';
import { AppUser } from '../models/user';
import { Repository } from './repository';

const token = <T extends { id: string }>(name: string) => new InjectionToken<Repository<T>>(name);

// Tokens for modules that use the standard CRUD contract.
export const DOCTOR_REPOSITORY = token<Doctor>('DOCTOR_REPOSITORY');
export const DEPARTMENT_REPOSITORY = token<Department>('DEPARTMENT_REPOSITORY');
export const ADMISSION_REPOSITORY = token<Admission>('ADMISSION_REPOSITORY');
export const BED_REPOSITORY = token<Bed>('BED_REPOSITORY');
export const LAB_ORDER_REPOSITORY = token<LabOrder>('LAB_ORDER_REPOSITORY');
export const RADIOLOGY_REPOSITORY = token<RadiologyRequest>('RADIOLOGY_REPOSITORY');
export const MEDICINE_REPOSITORY = token<Medicine>('MEDICINE_REPOSITORY');
export const INVENTORY_REPOSITORY = token<InventoryItem>('INVENTORY_REPOSITORY');
export const SUPPLIER_REPOSITORY = token<Supplier>('SUPPLIER_REPOSITORY');
export const PURCHASE_ORDER_REPOSITORY = token<PurchaseOrder>('PURCHASE_ORDER_REPOSITORY');
export const EMPLOYEE_REPOSITORY = token<Employee>('EMPLOYEE_REPOSITORY');
export const ATTENDANCE_REPOSITORY = token<AttendanceRecord>('ATTENDANCE_REPOSITORY');
export const LEAVE_REPOSITORY = token<LeaveRequest>('LEAVE_REPOSITORY');
export const PAYROLL_REPOSITORY = token<PayrollRecord>('PAYROLL_REPOSITORY');
export const USER_REPOSITORY = token<AppUser>('USER_REPOSITORY');
