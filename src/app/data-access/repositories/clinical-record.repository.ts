import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ClinicalRecord } from '../models/clinical';
import { Repository } from './repository';

export type ClinicalRecordRepository = Repository<ClinicalRecord> & {
  listForPatient(patientId: string): Observable<readonly ClinicalRecord[]>;
};
export const CLINICAL_RECORD_REPOSITORY = new InjectionToken<ClinicalRecordRepository>(
  'CLINICAL_RECORD_REPOSITORY',
);
