import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Appointment } from '../../../data-access/models/appointment';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { TIME_SLOTS } from '../services/appointment-rules';

/** Agenda for one day: every 30-minute slot with its bookings (or "Free"). */
@Component({
  selector: 'app-daily-schedule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusChipComponent],
  template: `
    <ol class="schedule" aria-label="Daily schedule">
      @for (row of rows(); track row.time) {
        <li>
          <span class="time">{{ row.time }}</span>
          <div class="slot">
            @for (a of row.items; track a.id) {
              <div class="booking">
                <strong>{{ patientName()(a.patientId) }}</strong>
                <span class="text-muted">{{ doctorName()(a.doctorId) }} · {{ a.reason }}</span>
                <app-status-chip [status]="a.status" />
              </div>
            } @empty {
              <span class="free text-muted">Free</span>
            }
          </div>
        </li>
      }
    </ol>
  `,
  styles: `
    .schedule {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    li {
      display: flex;
      gap: var(--app-space-4);
      padding: var(--app-space-2) 0;
      border-bottom: 1px solid var(--app-color-border);
    }
    .time {
      width: 56px;
      flex: none;
      font-variant-numeric: tabular-nums;
      color: var(--app-color-text-muted);
    }
    .slot {
      flex: 1;
      display: grid;
      gap: var(--app-space-2);
    }
    .booking {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2) var(--app-space-3);
      align-items: center;
    }
  `,
})
export class DailyScheduleComponent {
  readonly appointments = input.required<readonly Appointment[]>();
  readonly patientName = input.required<(id: string) => string>();
  readonly doctorName = input.required<(id: string) => string>();
  readonly doctorId = input<string>('');

  protected readonly rows = computed(() =>
    TIME_SLOTS.map((time) => ({
      time,
      items: this.appointments().filter(
        (a) => a.time === time && (!this.doctorId() || a.doctorId === this.doctorId()),
      ),
    })),
  );
}
