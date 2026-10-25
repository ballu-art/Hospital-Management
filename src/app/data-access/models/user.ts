import { Entity } from '../../shared/models/entity';

export const ROLES = ['super-admin', 'hr-manager', 'doctor', 'inventory-manager'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  'super-admin': 'Super Admin',
  'hr-manager': 'HR Manager',
  doctor: 'Doctor',
  'inventory-manager': 'Inventory Manager',
};

/** Demo application user (no credentials are stored). */
export interface AppUser extends Entity {
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly status: 'Active' | 'Disabled';
}

export interface HospitalSettings {
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly workingHours: string;
}
