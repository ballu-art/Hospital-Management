import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Page title, optional subtitle and projected contextual actions. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="text-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="actions"><ng-content /></div>
    </header>
  `,
  styles: `
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-3);
      margin-bottom: var(--app-space-4);
    }
    h1 {
      font-size: var(--app-font-size-xl);
    }
    p {
      margin: var(--app-space-1) 0 0;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2);
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
