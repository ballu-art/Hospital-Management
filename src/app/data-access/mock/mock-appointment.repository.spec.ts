import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideInstantMocks } from '../../../testing/test-providers';
import { isoDaysFromToday } from '../../shared/utils/date';
import { APPOINTMENT_REPOSITORY } from '../repositories/appointment.repository';
import { MOCK_APPOINTMENTS } from './mock-data';

describe('MockAppointmentRepository', () => {
  const setup = () => {
    TestBed.configureTestingModule({ providers: provideInstantMocks() });
    return TestBed.inject(APPOINTMENT_REPOSITORY);
  };
  const base = {
    patientId: 'pat-0001',
    doctorId: 'doc-0001',
    departmentId: 'dep-0001',
    date: isoDaysFromToday(9),
    time: '10:00',
    reason: 'Test',
    status: 'Scheduled' as const,
  };

  it('creates, updates and deletes', async () => {
    const repo = setup();
    const created = await firstValueFrom(repo.create(base));
    expect(created.id).toBe(`apt-${String(MOCK_APPOINTMENTS.length + 1).padStart(4, '0')}`);
    const updated = await firstValueFrom(repo.update(created.id, { status: 'Confirmed' }));
    expect(updated.status).toBe('Confirmed');
    await firstValueFrom(repo.delete(created.id));
    await expect(firstValueFrom(repo.get(created.id))).rejects.toMatchObject({ code: 'not-found' });
  });

  it('lists appointments for a day and for a patient', async () => {
    const repo = setup();
    const today = await firstValueFrom(repo.listForDay(isoDaysFromToday(0)));
    expect(today).toHaveLength(6);
    const forPatient = await firstValueFrom(repo.listForPatient('pat-0001'));
    expect(forPatient.every((a) => a.patientId === 'pat-0001')).toBe(true);
  });

  it('filters, sorts and pages', async () => {
    const repo = setup();
    const completed = await firstValueFrom(
      repo.list({ pageIndex: 0, pageSize: 50, filters: { status: 'Completed' } }),
    );
    expect(completed.items.every((a) => a.status === 'Completed')).toBe(true);
    const page = await firstValueFrom(
      repo.list({ pageIndex: 0, pageSize: 5, sort: { active: 'dateTime', direction: 'desc' } }),
    );
    expect(page.items).toHaveLength(5);
    expect(page.total).toBe(MOCK_APPOINTMENTS.length);
    const stamps = page.items.map((a) => `${a.date} ${a.time}`);
    expect([...stamps].sort().reverse()).toEqual(stamps);
  });
});
