import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Empty result placeholder. Project a call-to-action button as content. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="empty">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <h2>{{ title() }}</h2>
      @if (message()) {
        <p class="text-muted">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      display: grid;
      justify-items: center;
      gap: var(--app-space-2);
      padding: var(--app-space-6) var(--app-space-4);
      text-align: center;
    }
    mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--app-color-text-muted);
    }
    h2 {
      font-size: var(--app-font-size-lg);
    }
    p {
      margin: 0 0 var(--app-space-2);
    }
  `,
})
export class EmptyStateComponent {
  readonly title = input<string>('Nothing to show');
  readonly message = input<string>('');
  readonly icon = input<string>('inbox');
}
