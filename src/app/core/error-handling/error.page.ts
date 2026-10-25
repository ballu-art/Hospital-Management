import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

/** One page for 404, 403 and generic application errors; content comes from route data. */
@Component({
  selector: 'app-error-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <section class="error-page" aria-labelledby="error-title">
      <mat-icon aria-hidden="true">{{ data['icon'] }}</mat-icon>
      <p class="code">{{ data['code'] }}</p>
      <h1 id="error-title">{{ data['heading'] }}</h1>
      <p class="text-muted">{{ data['message'] }}</p>
      <a mat-flat-button routerLink="/dashboard">Back to dashboard</a>
    </section>
  `,
  styles: `
    .error-page {
      display: grid;
      justify-items: center;
      gap: var(--app-space-3);
      padding: var(--app-space-6) var(--app-space-4);
      text-align: center;
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--app-color-primary);
      }
      .code {
        margin: 0;
        font-size: var(--app-font-size-xl);
        color: var(--app-color-text-muted);
      }
    }
  `,
})
export class ErrorPage {
  protected readonly data = inject(ActivatedRoute).snapshot.data;
}
