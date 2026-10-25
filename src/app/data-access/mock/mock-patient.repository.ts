import { Injectable } from '@angular/core';
import { AppError } from '../../shared/models/app-error';
import { toIsoDate } from '../../shared/utils/date';
import { Patient, PatientInput, patientFullName, validatePatientInput } from '../models/patient';
import { PatientRepository } from '../repositories/patient.repository';
import { InMemoryRepository } from './in-memory.repository';
import { MOCK_PATIENTS } from './mock-data';

@Injectable()
export class MockPatientRepository
  extends InMemoryRepository<Patient, PatientInput>
  implements PatientRepository
{
  constructor() {
    super(MOCK_PATIENTS, {
      idPrefix: 'pat',
      searchText: (p) =>
        [p.id, p.medicalRecordNumber, patientFullName(p), p.phone, p.email].join(' '),
      sortValues: {
        name: (p) => `${p.lastName} ${p.firstName}`,
        // Younger patients first when ascending.
        age: (p) => -new Date(p.dateOfBirth).getTime(),
      },
      filterPredicates: {
        registeredFrom: (p, v) => p.registrationDate >= v,
        registeredTo: (p, v) => p.registrationDate <= v,
      },
      build: (input, id) => ({
        ...input,
        id,
        medicalRecordNumber: `MRN-${id.split('-')[1].padStart(6, '0')}`,
        registrationDate: toIsoDate(new Date()),
      }),
      validate: (candidate, others) => {
        const errors = validatePatientInput(candidate);
        if (errors.length) throw new AppError('validation', 'Patient data is invalid.', errors);
        const key = (p: Patient) => `${patientFullName(p).toLowerCase()}|${p.dateOfBirth}`;
        if (others.some((o) => key(o) === key(candidate))) {
          throw new AppError(
            'conflict',
            'A patient with the same name and date of birth already exists.',
          );
        }
      },
    });
  }
}
