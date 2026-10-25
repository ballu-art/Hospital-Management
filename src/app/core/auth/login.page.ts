import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ROLE_LABELS } from '../../data-access/models/user';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { toErrorMessage } from '../../shared/models/app-error';
import { AuthService } from './auth.service';
import { ROLE_DESCRIPTIONS } from './permissions';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatProgressBarModule,
    ErrorStateComponent,
  ],
  template: `
    <main class="login">
      <section class="app-card card" aria-labelledby="login-title">
        <mat-icon class="logo" aria-hidden="true">local_hospital</mat-icon>
        <h1 id="login-title">Hospital ERP</h1>
        <p class="demo" role="note">
          <strong>Demonstration sign-in.</strong> No password is required and no real authentication
          takes place. Never use this screen or this data in production.
        </p>
        @if (accounts() === undefined) {
          <mat-progress-bar mode="indeterminate" aria-label="Loading demo accounts" />
        } @else if (loadError()) {
          <app-error-state [message]="loadError()" />
        } @else {
          <form (ngSubmit)="submit()" novalidate>
            <mat-form-field>
              <mat-label>Demo account</mat-label>
              <mat-select [formControl]="account" required>
                @for (u of accounts(); track u.id) {
                  <mat-option [value]="u.id">{{ u.name }} — {{ roleLabels[u.role] }}</mat-option>
                }
              </mat-select>
              @if (account.invalid && account.touched) {
                <mat-error>Select a demo account.</mat-error>
              }
              @if (selectedDescription()) {
                <mat-hint>{{ selectedDescription() }}</mat-hint>
              }
            </mat-form-field>
            @if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            }
            <button mat-flat-button type="submit">
              {{ busy() ? 'Signing in…' : 'Continue to demo' }}
            </button>
          </form>
        }
      </section>
    </main>
  `,
  styles: `
    .login {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: var(--app-space-4);
    }
    .card {
      width: min(440px, 100%);
      display: grid;
      gap: var(--app-space-4);
      justify-items: start;
    }
    form {
      display: grid;
      gap: var(--app-space-4);
      width: 100%;
    }
    .logo {
      color: var(--app-color-primary);
      font-size: 40px;
      width: 40px;
      height: 40px;
    }
    .demo {
      margin: 0;
      padding: var(--app-space-3);
      border-radius: var(--app-radius-md);
      background: var(--app-color-warning-soft);
      color: var(--app-color-warning);
    }
    .error {
      color: var(--app-color-error);
      margin: 0;
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly account = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly loadError = signal('');
  protected readonly accounts = toSignal(
    this.auth.demoAccounts().pipe(
      catchError((e: unknown) => {
        this.loadError.set(toErrorMessage(e));
        return of([]);
      }),
    ),
  );

  protected selectedDescription(): string {
    const user = this.accounts()?.find((u) => u.id === this.account.value);
    return user ? ROLE_DESCRIPTIONS[user.role] : '';
  }

  protected submit(): void {
    if (this.busy()) return;
    this.account.markAsTouched();
    if (this.account.invalid) return;
    this.busy.set(true);
    this.error.set('');
    this.auth.signIn(this.account.value).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        // Only follow in-app relative paths.
        void this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/dashboard');
      },
      error: (e: unknown) => {
        this.error.set(toErrorMessage(e));
        this.busy.set(false);
      },
    });
  }
}
