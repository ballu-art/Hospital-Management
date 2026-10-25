import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { PATIENT_STATUSES } from '../../../data-access/models/patient';
import { AbstractControl } from '@angular/forms';
import { errorMessage } from '../../../shared/validators/app-validators';
import { PATIENT_GENDERS, PatientForm } from '../services/patient-form';

/** Presentational patient form. The parent owns the form instance and the save operation. */
@Component({
  selector: 'app-patient-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    RouterLink,
  ],
  templateUrl: './patient-form.component.html',
  styles: `
    fieldset {
      border: 0;
      padding: 0;
      margin: 0 0 var(--app-space-4);
    }
    legend {
      font-weight: 500;
      margin-bottom: var(--app-space-3);
    }
    .actions {
      display: flex;
      gap: var(--app-space-2);
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .error {
      color: var(--app-color-error);
    }
  `,
})
export class PatientFormComponent {
  readonly form = input.required<PatientForm>();
  readonly saving = input(false);
  readonly submitLabel = input('Save');
  readonly cancelLink = input<string | string[]>('/patients');
  readonly serverError = input('');
  readonly attempted = input(false);
  readonly save = output<void>();

  protected readonly genders = PATIENT_GENDERS;
  protected readonly statuses = PATIENT_STATUSES;
  protected readonly maxDate = new Date();

  protected err(control: AbstractControl | null): string {
    return errorMessage(control);
  }
}
