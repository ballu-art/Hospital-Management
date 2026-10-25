import { Entity } from '../../shared/models/entity';

export const CLINICAL_RECORD_TYPES = ['Diagnosis', 'Prescription', 'Medical note'] as const;
export type ClinicalRecordType = (typeof CLINICAL_RECORD_TYPES)[number];

/** Medical history entry: diagnosis, prescription or medical note, added by a doctor. */
export interface ClinicalRecord extends Entity {
  readonly patientId: string;
  readonly doctorId: string;
  readonly type: ClinicalRecordType;
  readonly title: string;
  readonly details: string;
  /** ISO date. */
  readonly recordedOn: string;
}
