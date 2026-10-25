import { Injectable, signal } from '@angular/core';
import { HospitalSettings } from '../../data-access/models/user';

const DEFAULTS: HospitalSettings = {
  name: 'Riverside General Hospital',
  address: '100 Demo Avenue, Sample City',
  phone: '555-0100',
  email: 'info@riverside.example.test',
  workingHours: 'OPD 08:00–18:00 · Emergency 24×7',
};

/** In-memory hospital profile (resets on reload). */
@Injectable({ providedIn: 'root' })
export class HospitalSettingsService {
  private readonly state = signal<HospitalSettings>(DEFAULTS);
  readonly settings = this.state.asReadonly();

  update(next: HospitalSettings): void {
    this.state.set({ ...next });
  }
}
