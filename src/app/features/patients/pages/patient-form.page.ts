import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { toErrorMessage } from '../../../shared/models/app-error';
import { PatientFormComponent } from '../components/patient-form.component';
import { createPatientForm, patchPatientForm, toPatientInput } from '../services/patient-form';

/** Register (no id) or edit (id route param) a patient. */
@Component({
  selector: 'app-patient-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    ErrorStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    PatientFormComponent,
  ],
  template: `
    <app-page-header
      [title]="id() ? 'Edit patient' : 'Register patient'"
      [subtitle]="
        id()
          ? ''
          : 'Enter fictional demo details only. A medical record number is assigned automatically.'
      "
    />
    @if (loadError()) {
      <app-error-state [message]="loadError()" />
    } @else if (loading()) {
      <app-loading-state message="Loading patient…" />
    } @else {
      <section class="app-card">
        <app-patient-form
          [form]="form"
          [saving]="saving()"
          [attempted]="attempted()"
          [serverError]="serverError()"
          [submitLabel]="id() ? 'Save changes' : 'Register patient'"
          [cancelLink]="id() ? ['/patients', id()!] : '/patients'"
          (save)="submit()"
        />
      </section>
    }
  `,
})
export class PatientFormPage implements OnInit {
  /** Bound from the `:id` route parameter (component input binding). */
  readonly id = input<string>();

  private readonly repo = inject(PATIENT_REPOSITORY);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  protected readonly form = createPatientForm();
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly attempted = signal(false);
  protected readonly serverError = signal('');
  protected readonly loadError = signal('');

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    this.loading.set(true);
    this.repo.get(id).subscribe({
      next: (patient) => {
        patchPatientForm(this.form, patient);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loadError.set(toErrorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.saving()) return;
    this.attempted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.serverError.set('');
    const input = toPatientInput(this.form);
    const id = this.id();
    const save$ = id ? this.repo.update(id, input) : this.repo.create(input);
    save$.subscribe({
      next: (patient) => {
        this.notify.success(
          id ? 'Patient updated.' : `Patient registered (${patient.medicalRecordNumber}).`,
        );
        void this.router.navigate(['/patients', patient.id]);
      },
      error: (e: unknown) => {
        this.serverError.set(toErrorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
