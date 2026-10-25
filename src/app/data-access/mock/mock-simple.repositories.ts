import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClinicalRecord } from '../models/clinical';
import { Bill } from '../models/operations';
import { BillRepository } from '../repositories/bill.repository';
import { ClinicalRecordRepository } from '../repositories/clinical-record.repository';
import { InMemoryRepository } from './in-memory.repository';
import { MOCK_CLINICAL_RECORDS } from './mock-data';
import { MOCK_BILLS } from './mock-data-ops';

@Injectable()
export class MockClinicalRecordRepository
  extends InMemoryRepository<ClinicalRecord>
  implements ClinicalRecordRepository
{
  constructor() {
    super(MOCK_CLINICAL_RECORDS, {
      idPrefix: 'rec',
      searchText: (r) => `${r.title} ${r.details} ${r.type}`,
    });
  }

  listForPatient(patientId: string): Observable<readonly ClinicalRecord[]> {
    return this.respond(() =>
      this.snapshot
        .filter((r) => r.patientId === patientId)
        .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn)),
    );
  }
}

@Injectable()
export class MockBillRepository extends InMemoryRepository<Bill> implements BillRepository {
  constructor() {
    super(MOCK_BILLS, {
      idPrefix: 'bil',
      searchText: (b) => `${b.invoiceNumber} ${b.description} ${b.patientId} ${b.status}`,
    });
  }

  listForPatient(patientId: string): Observable<readonly Bill[]> {
    return this.respond(() => this.snapshot.filter((b) => b.patientId === patientId));
  }
}
