import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatusTone } from '../status-chip/status-chip.component';

/** KPI tile. Becomes a link when a route is supplied. */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, NgTemplateOutlet, RouterLink],
  template: `
    @if (route()) {
      <a class="card" [routerLink]="route()">
        <ng-container *ngTemplateOutlet="body" />
      </a>
    } @else {
      <div class="card"><ng-container *ngTemplateOutlet="body" /></div>
    }
    <ng-template #body>
      <span class="icon" [class]="'tone-' + tone()"
        ><mat-icon aria-hidden="true">{{ icon() }}</mat-icon></span
      >
      <span class="text">
        <span class="label">{{ label() }}</span>
        <span class="value">{{ value() }}</span>
        @if (hint()) {
          <span class="hint">{{ hint() }}</span>
        }
      </span>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
    }
    .card {
      display: flex;
      gap: var(--app-space-4);
      align-items: center;
      height: 100%;
      padding: var(--app-space-4);
      color: inherit;
      text-decoration: none;
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      box-shadow: var(--app-elevation-1);
    }
    a.card:hover {
      border-color: var(--app-color-primary);
    }
    .icon {
      display: grid;
      place-items: center;
      flex: none;
      width: 48px;
      height: 48px;
      border-radius: var(--app-radius-md);
    }
    .text {
      display: grid;
      min-width: 0;
    }
    .label {
      color: var(--app-color-text-muted);
      font-size: var(--app-font-size-sm);
    }
    .value {
      font-size: var(--app-font-size-xl);
      font-weight: 500;
    }
    .hint {
      color: var(--app-color-text-muted);
      font-size: var(--app-font-size-sm);
    }
    .tone-info {
      background: var(--app-color-info-soft);
      color: var(--app-color-info);
    }
    .tone-success {
      background: var(--app-color-success-soft);
      color: var(--app-color-success);
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
      background: var(--app-color-primary-soft);
      color: var(--app-color-primary);
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number | null>();
  readonly icon = input.required<string>();
  readonly hint = input<string>('');
  readonly tone = input<StatusTone>('neutral');
  readonly route = input<string | null>(null);
}
