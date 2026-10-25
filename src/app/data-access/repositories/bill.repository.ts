import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Bill } from '../models/operations';
import { Repository } from './repository';

export type BillRepository = Repository<Bill> & {
  listForPatient(patientId: string): Observable<readonly Bill[]>;
};
export const BILL_REPOSITORY = new InjectionToken<BillRepository>('BILL_REPOSITORY');
