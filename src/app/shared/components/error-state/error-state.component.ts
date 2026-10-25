import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="error" role="alert">
      <mat-icon aria-hidden="true">error_outline</mat-icon>
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
      @if (retryable()) {
        <button mat-stroked-button type="button" (click)="retry.emit()">Try again</button>
      }
    </div>
  `,
  styles: `
    .error {
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
      color: var(--app-color-error);
    }
    h2 {
      font-size: var(--app-font-size-lg);
    }
    p {
      margin: 0 0 var(--app-space-2);
      color: var(--app-color-text-muted);
    }
  `,
})
export class ErrorStateComponent {
  readonly title = input<string>('Something went wrong');
  readonly message = input<string>('The data could not be loaded.');
  readonly retryable = input<boolean>(false);
  readonly retry = output<void>();
}
