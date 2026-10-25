import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideInstantMocks } from '../../../../testing/test-providers';
import { Appointment } from '../../../data-access/models/appointment';
import { isoDaysFromToday } from '../../../shared/utils/date';
import { TIME_SLOTS, canTransition, isInPast, validateSlot } from './appointment-rules';
import { AppointmentsService } from './appointments.service';

const appt = (over: Partial<Appointment>): Appointment => ({
  id: 'x',
  patientId: 'p1',
  doctorId: 'd1',
  departmentId: 'dep',
  date: '2030-01-10',
  time: '10:00',
  reason: 'r',
  status: 'Scheduled',
  ...over,
});
const now = new Date('2030-01-10T09:00:00');

describe('appointment rules', () => {
  it('offers 30-minute slots from 08:00 to 17:30', () => {
    expect(TIME_SLOTS[0]).toBe('08:00');
    expect(TIME_SLOTS.at(-1)).toBe('17:30');
    expect(TIME_SLOTS).toHaveLength(20);
  });

  it('detects past dates and times', () => {
    expect(isInPast('2030-01-09', '12:00', now)).toBe(true);
    expect(isInPast('2030-01-10', '08:30', now)).toBe(true);
    expect(isInPast('2030-01-10', '09:30', now)).toBe(false);
  });

  it('rejects doctor and patient conflicts but ignores cancelled bookings and the edited record', () => {
    const day = [appt({ id: 'a' })];
    const candidate = { date: '2030-01-10', time: '10:00', doctorId: 'd1', patientId: 'p2' };
    expect(validateSlot(candidate, day, now)).toContain(
      'The doctor already has an appointment at this time.',
    );
    expect(validateSlot({ ...candidate, doctorId: 'd2', patientId: 'p1' }, day, now)).toContain(
      'The patient already has an appointment at this time.',
    );
    expect(validateSlot({ ...candidate, excludeId: 'a' }, day, now)).toEqual([]);
    expect(validateSlot(candidate, [appt({ id: 'a', status: 'Cancelled' })], now)).toEqual([]);
  });

  it('rejects past slots and off-grid times', () => {
    expect(
      validateSlot({ date: '2030-01-09', time: '10:00', doctorId: 'd', patientId: 'p' }, [], now),
    ).toContain('Appointments cannot be scheduled in the past.');
    expect(
      validateSlot({ date: '2030-01-11', time: '10:15', doctorId: 'd', patientId: 'p' }, [], now)
        .length,
    ).toBeGreaterThan(0);
  });

  it('only allows sensible status transitions', () => {
    expect(canTransition('Scheduled', 'Confirmed')).toBe(true);
    expect(canTransition('Completed', 'Cancelled')).toBe(false);
    expect(canTransition('Cancelled', 'Scheduled')).toBe(false);
  });
});

describe('AppointmentsService', () => {
  const setup = () => {
    TestBed.configureTestingModule({ providers: provideInstantMocks() });
    return TestBed.inject(AppointmentsService);
  };
  const input = {
    patientId: 'pat-0004',
    doctorId: 'doc-0001',
    departmentId: 'dep-0001',
    date: isoDaysFromToday(10),
    time: '09:00',
    reason: 'Check',
    status: 'Scheduled' as const,
  };

  it('books a free slot and then refuses a double booking', async () => {
    const service = setup();
    const booked = await firstValueFrom(service.book(input));
    expect(booked.status).toBe('Scheduled');
    await expect(
      firstValueFrom(service.book({ ...input, patientId: 'pat-0005' })),
    ).rejects.toMatchObject({ code: 'conflict' });
    const slots = await firstValueFrom(service.availableSlots(input.date, input.doctorId));
    expect(slots).not.toContain('09:00');
    expect(slots).toContain('09:30');
  });

  it('refuses bookings with a doctor on leave and in the past', async () => {
    const service = setup();
    await expect(
      firstValueFrom(service.book({ ...input, doctorId: 'doc-0007' })),
    ).rejects.toMatchObject({ code: 'conflict' });
    await expect(
      firstValueFrom(service.book({ ...input, date: isoDaysFromToday(-1) })),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('reschedules and cancels, but blocks edits to cancelled appointments', async () => {
    const service = setup();
    const booked = await firstValueFrom(service.book(input));
    const moved = await firstValueFrom(service.reschedule(booked.id, input.date, '11:00'));
    expect(moved.time).toBe('11:00');
    const cancelled = await firstValueFrom(service.setStatus(booked.id, 'Cancelled'));
    expect(cancelled.status).toBe('Cancelled');
    await expect(
      firstValueFrom(service.reschedule(booked.id, input.date, '12:00')),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(firstValueFrom(service.setStatus(booked.id, 'Confirmed'))).rejects.toMatchObject({
      code: 'validation',
    });
  });
});
