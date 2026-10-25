import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideInstantMocks } from '../../../testing/test-providers';
import { AppError } from '../../shared/models/app-error';
import { PatientInput } from '../models/patient';
import { PATIENT_REPOSITORY } from '../repositories/patient.repository';
import { MockControl } from './mock-control.service';
import { MOCK_PATIENTS } from './mock-data';

const input: PatientInput = {
  firstName: 'Nova',
  lastName: 'Tester',
  dateOfBirth: '1985-05-05',
  gender: 'Other',
  phone: '+1 555-0199',
  email: 'nova@example.test',
  address: '5 Test Road',
  status: 'Active',
  emergencyContact: { name: 'Sam Tester', phone: '555-0198', relationship: 'Friend' },
};
const query = { pageIndex: 0, pageSize: 100 };

describe('MockPatientRepository', () => {
  const setup = () => {
    TestBed.configureTestingModule({ providers: provideInstantMocks() });
    return TestBed.inject(PATIENT_REPOSITORY);
  };

  it('lists seed data deterministically', async () => {
    const repo = setup();
    const page = await firstValueFrom(repo.list(query));
    expect(page.total).toBe(MOCK_PATIENTS.length);
    expect(page.items[0].id).toBe('pat-0001');
  });

  it('creates a patient with generated id, MRN and registration date', async () => {
    const repo = setup();
    const created = await firstValueFrom(repo.create(input));
    expect(created.id).toBe(`pat-${String(MOCK_PATIENTS.length + 1).padStart(4, '0')}`);
    expect(created.medicalRecordNumber).toMatch(/^MRN-\d{6}$/);
    expect((await firstValueFrom(repo.list(query))).total).toBe(MOCK_PATIENTS.length + 1);
  });

  it('rejects invalid data and duplicates', async () => {
    const repo = setup();
    await expect(firstValueFrom(repo.create({ ...input, firstName: '' }))).rejects.toMatchObject({
      code: 'validation',
    });
    await firstValueFrom(repo.create(input));
    await expect(firstValueFrom(repo.create(input))).rejects.toMatchObject({ code: 'conflict' });
  });

  it('updates immutably without touching the seed', async () => {
    const repo = setup();
    const before = await firstValueFrom(repo.get('pat-0001'));
    const updated = await firstValueFrom(repo.update('pat-0001', { phone: '+1 555-0777' }));
    expect(updated.phone).toBe('+1 555-0777');
    expect(updated).not.toBe(before);
    expect(MOCK_PATIENTS[0].phone).not.toBe('+1 555-0777');
  });

  it('deletes and reports not-found afterwards', async () => {
    const repo = setup();
    await firstValueFrom(repo.delete('pat-0002'));
    await expect(firstValueFrom(repo.get('pat-0002'))).rejects.toBeInstanceOf(AppError);
    await expect(firstValueFrom(repo.delete('pat-0002'))).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('searches by name and MRN, case-insensitively', async () => {
    const repo = setup();
    expect(
      (await firstValueFrom(repo.list({ ...query, search: 'DESAI' }))).items.map((p) => p.lastName),
    ).toEqual(['Desai']);
    expect((await firstValueFrom(repo.list({ ...query, search: 'mrn-000003' }))).total).toBe(1);
    expect((await firstValueFrom(repo.list({ ...query, search: 'no such patient' }))).total).toBe(
      0,
    );
  });

  it('filters by status and registration date range', async () => {
    const repo = setup();
    const inactive = await firstValueFrom(repo.list({ ...query, filters: { status: 'Inactive' } }));
    expect(inactive.items.every((p) => p.status === 'Inactive')).toBe(true);
    const recent = await firstValueFrom(
      repo.list({ ...query, filters: { registeredFrom: MOCK_PATIENTS[13].registrationDate } }),
    );
    expect(recent.total).toBeGreaterThan(0);
    expect(recent.total).toBeLessThan(MOCK_PATIENTS.length);
  });

  it('sorts and paginates', async () => {
    const repo = setup();
    const sorted = await firstValueFrom(
      repo.list({ pageIndex: 0, pageSize: 3, sort: { active: 'name', direction: 'asc' } }),
    );
    expect(sorted.items.map((p) => p.lastName)).toEqual(['Almeida', 'Banerjee', 'Bennett']);
    expect(sorted.total).toBe(MOCK_PATIENTS.length);
    const second = await firstValueFrom(
      repo.list({ pageIndex: 1, pageSize: 3, sort: { active: 'name', direction: 'asc' } }),
    );
    expect(second.items).toHaveLength(3);
    expect(second.items[0].id).not.toBe(sorted.items[0].id);
  });

  it('surfaces simulated failures once when set to "next"', async () => {
    const repo = setup();
    TestBed.inject(MockControl).failureMode.set('next');
    await expect(firstValueFrom(repo.list(query))).rejects.toMatchObject({ code: 'simulated' });
    await expect(firstValueFrom(repo.list(query))).resolves.toBeTruthy();
  });
});
