import { InjectionToken } from '@angular/core';
import { Patient, PatientInput } from '../models/patient';
import { Repository } from './repository';

export type PatientRepository = Repository<Patient, PatientInput>;
export const PATIENT_REPOSITORY = new InjectionToken<PatientRepository>('PATIENT_REPOSITORY');
