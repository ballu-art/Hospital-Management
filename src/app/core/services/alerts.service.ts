import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Subject, catchError, forkJoin, of, switchMap } from 'rxjs';
import { EXPIRY_WARNING_DAYS, isExpiringSoon, isLowStock } from '../../data-access/models/supply';
import {
  INVENTORY_REPOSITORY,
  LEAVE_REPOSITORY,
  MEDICINE_REPOSITORY,
} from '../../data-access/repositories/repository-tokens';
import { isoDaysFromToday } from '../../shared/utils/date';
import { AuthService } from '../auth/auth.service';

export interface AlertSummary {
  readonly pendingLeaves: number;
  readonly lowStock: number;
  readonly expiringMedicines: number;
}

/** Operational alerts shared by the top bar and the dashboard. Counts only what the user may see. */
@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly auth = inject(AuthService);
  private readonly leaves = inject(LEAVE_REPOSITORY);
  private readonly medicines = inject(MEDICINE_REPOSITORY);
  private readonly inventory = inject(INVENTORY_REPOSITORY);
  private readonly refreshRequests = new Subject<void>();

  readonly summary = signal<AlertSummary>({ pendingLeaves: 0, lowStock: 0, expiringMedicines: 0 });

  constructor() {
    this.refreshRequests
      .pipe(
        switchMap(() =>
          forkJoin({
            leaves: this.auth.can('leave:read') ? this.leaves.all() : of([]),
            medicines: this.auth.can('pharmacy:read') ? this.medicines.all() : of([]),
            inventory: this.auth.can('inventory:read') ? this.inventory.all() : of([]),
          }).pipe(catchError(() => EMPTY)),
        ),
      )
      .subscribe(({ leaves, medicines, inventory }) => {
        const limit = isoDaysFromToday(EXPIRY_WARNING_DAYS);
        this.summary.set({
          pendingLeaves: leaves.filter((l) => l.status === 'Pending').length,
          lowStock: medicines.filter(isLowStock).length + inventory.filter(isLowStock).length,
          expiringMedicines: medicines.filter((m) => isExpiringSoon(m, limit)).length,
        });
      });
  }

  refresh(): void {
    this.refreshRequests.next();
  }
}
