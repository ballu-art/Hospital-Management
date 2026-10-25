import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Appointment, AppointmentInput } from '../models/appointment';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { InMemoryRepository } from './in-memory.repository';
import { MOCK_APPOINTMENTS } from './mock-data';

@Injectable()
export class MockAppointmentRepository
  extends InMemoryRepository<Appointment, AppointmentInput>
  implements AppointmentRepository
{
  constructor() {
    super(MOCK_APPOINTMENTS, {
      idPrefix: 'apt',
      searchText: (a) => `${a.id} ${a.patientId} ${a.doctorId} ${a.reason} ${a.date}`,
      sortValues: { dateTime: (a) => `${a.date} ${a.time}` },
    });
  }

  listForDay(date: string): Observable<readonly Appointment[]> {
    return this.respond(() => this.snapshot.filter((a) => a.date === date));
  }

  listForPatient(patientId: string): Observable<readonly Appointment[]> {
    return this.respond(() => this.snapshot.filter((a) => a.patientId === patientId));
  }
}
