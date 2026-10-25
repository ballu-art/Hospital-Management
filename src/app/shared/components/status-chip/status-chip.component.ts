import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusTone = 'success' | 'info' | 'warning' | 'error' | 'neutral';

const TONES: Readonly<Record<string, StatusTone>> = {
  Active: 'success',
  Available: 'success',
  Completed: 'success',
  Paid: 'success',
  Approved: 'success',
  Present: 'success',
  Received: 'success',
  Discharged: 'success',
  'In stock': 'success',
  'Low stock': 'warning',
  'Expiring soon': 'warning',
  Expired: 'error',
  Confirmed: 'info',
  Scheduled: 'info',
  Ordered: 'info',
  'In progress': 'info',
  Processed: 'info',
  Open: 'info',
  Pending: 'warning',
  'Partially paid': 'warning',
  Late: 'warning',
  Urgent: 'warning',
  'In surgery': 'warning',
  Maintenance: 'warning',
  Occupied: 'warning',
  'On leave': 'warning',
  Cancelled: 'error',
  Rejected: 'error',
  Unpaid: 'error',
  Absent: 'error',
  Disabled: 'error',
  Inactive: 'neutral',
  Draft: 'neutral',
  Routine: 'neutral',
};

/** Status badge. The text label always carries the meaning; colour is reinforcement only. */
@Component({
  selector: 'app-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="chip" [class]="'tone-' + tone()">{{ status() }}</span>`,
  styles: `
    .chip {
      display: inline-block;
      padding: 2px var(--app-space-3);
      border-radius: 999px;
      font-size: var(--app-font-size-sm);
      font-weight: 500;
      white-space: nowrap;
    }
    .tone-success {
      background: var(--app-color-success-soft);
      color: var(--app-color-success);
    }
    .tone-info {
      background: var(--app-color-info-soft);
      color: var(--app-color-info);
    }
    .tone-warning {
      background: var(--app-color-warning-soft);
      color: var(--app-color-warning);
    }
    .tone-error {
      background: var(--app-color-error-soft);
      color: var(--app-color-error);
    }
    .tone-neutral {
      background: var(--app-color-neutral-soft);
      color: var(--app-color-neutral);
    }
  `,
})
export class StatusChipComponent {
  readonly status = input.required<string>();
  protected readonly tone = computed<StatusTone>(() => TONES[this.status()] ?? 'neutral');
}
