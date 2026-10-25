import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AppError } from '../../shared/models/app-error';

export type FailureMode = 'off' | 'next' | 'always';

/** Demo switches that let developers exercise loading and error states. */
@Injectable({ providedIn: 'root' })
export class MockControl {
  readonly latencyMs = signal<number>(environment.mockLatencyMs);
  readonly failureMode = signal<FailureMode>('off');

  /** Called by mock repositories before every operation. */
  beforeRequest(): void {
    const mode = this.failureMode();
    if (mode === 'off') return;
    if (mode === 'next') this.failureMode.set('off');
    throw new AppError('simulated', 'Simulated server error (demo setting).');
  }
}
