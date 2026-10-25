import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading" role="status" aria-live="polite">
      <mat-spinner [diameter]="32" aria-hidden="true" />
      <span>{{ message() }}</span>
    </div>
  `,
  styles: `
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--app-space-3);
      padding: var(--app-space-6);
      color: var(--app-color-text-muted);
    }
  `,
})
export class LoadingStateComponent {
  readonly message = input<string>('Loading…');
}
