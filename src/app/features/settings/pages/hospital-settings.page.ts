import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/auth/auth.service';
import { HospitalSettingsService } from '../../../core/services/hospital-settings.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FailureMode, MockControl } from '../../../data-access/mock/mock-control.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { errorMessage, notBlank, phoneNumber } from '../../../shared/validators/app-validators';

@Component({
  selector: 'app-hospital-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header title="Hospital settings" subtitle="Hospital profile and demo controls" />

    <section class="app-card block" aria-labelledby="profile-title">
      <h2 id="profile-title">Hospital profile</h2>
      <form [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="app-form-grid">
          <mat-form-field>
            <mat-label>Hospital name</mat-label>
            <input matInput formControlName="name" />
            <mat-error>{{ err(form.controls.name) }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Phone</mat-label>
            <input matInput type="tel" formControlName="phone" />
            <mat-error>{{ err(form.controls.phone) }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
            <mat-error>{{ err(form.controls.email) }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Working hours</mat-label>
            <input matInput formControlName="workingHours" />
            <mat-error>{{ err(form.controls.workingHours) }}</mat-error>
          </mat-form-field>
          <mat-form-field class="full-width">
            <mat-label>Address</mat-label>
            <input matInput formControlName="address" />
            <mat-error>{{ err(form.controls.address) }}</mat-error>
          </mat-form-field>
        </div>
        @if (auth.can('settings:write')) {
          <button mat-flat-button type="submit">Save profile</button>
        } @else {
          <p class="text-muted">Your role can view but not change settings.</p>
        }
      </form>
    </section>

    <section class="app-card block" aria-labelledby="demo-title">
      <h2 id="demo-title">Demo data controls</h2>
      <p class="text-muted">
        These switches only affect the in-memory mock repositories. They let you exercise loading
        and error states. Changes to demo data are lost when the page reloads.
      </p>
      <div class="app-form-grid">
        <mat-form-field>
          <mat-label>Simulated latency</mat-label>
          <mat-select
            [value]="mock.latencyMs()"
            (selectionChange)="mock.latencyMs.set($event.value)"
          >
            <mat-option [value]="0">None</mat-option>
            <mat-option [value]="300">300 ms</mat-option>
            <mat-option [value]="1500">1.5 seconds</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Simulated server errors</mat-label>
          <mat-select [value]="mock.failureMode()" (selectionChange)="setFailure($event.value)">
            <mat-option value="off">Off</mat-option>
            <mat-option value="next">Fail the next request only</mat-option>
            <mat-option value="always">Fail every request</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </section>
  `,
  styles: `
    .block {
      margin-bottom: var(--app-space-4);
      display: grid;
      gap: var(--app-space-3);
      justify-items: start;
    }
    .block form,
    .block .app-form-grid {
      width: 100%;
    }
    h2 {
      font-size: var(--app-font-size-lg);
    }
    p {
      margin: 0;
    }
    form {
      display: grid;
      gap: var(--app-space-3);
      justify-items: start;
    }
  `,
})
export class HospitalSettingsPage {
  private readonly service = inject(HospitalSettingsService);
  private readonly notify = inject(NotificationService);
  protected readonly auth = inject(AuthService);
  protected readonly mock = inject(MockControl);
  protected readonly saved = signal(false);

  private readonly s = this.service.settings();
  protected readonly form = new FormGroup({
    name: new FormControl(this.s.name, {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(80)],
    }),
    address: new FormControl(this.s.address, {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(200)],
    }),
    phone: new FormControl(this.s.phone, {
      nonNullable: true,
      validators: [Validators.required, phoneNumber],
    }),
    email: new FormControl(this.s.email, {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    workingHours: new FormControl(this.s.workingHours, {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(100)],
    }),
  });

  constructor() {
    if (!this.auth.can('settings:write')) this.form.disable();
  }

  protected err = errorMessage;

  protected setFailure(mode: FailureMode): void {
    this.mock.failureMode.set(mode);
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.service.update({
      name: v.name.trim(),
      address: v.address.trim(),
      phone: v.phone.trim(),
      email: v.email.trim(),
      workingHours: v.workingHours.trim(),
    });
    this.notify.success('Hospital profile saved (until the page reloads).');
  }
}
