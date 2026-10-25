import { ChangeDetectionStrategy, Component, Signal, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Observable, of, switchMap, map, toArray } from 'rxjs';
import { toErrorMessage } from '../../models/app-error';
import { Entity, Option } from '../../models/entity';
import { fromIsoDate, toIsoDate } from '../../utils/date';
import { errorMessage, notBlank, phoneNumber } from '../../validators/app-validators';
import { FieldValue, ResourceConfig, ResourceField } from './resource-config';

export type ResourceDialogMode = 'create' | 'edit' | 'view';

export interface ResourceDialogData<T extends Entity> {
  readonly config: ResourceConfig<T>;
  readonly item: T | null;
  readonly mode: ResourceDialogMode;
}

type ResourceForm = FormGroup<Record<string, FormControl<FieldValue>>>;

/** Typed reactive-form dialog generated from a ResourceConfig. Resolves with the saved record. */
@Component({
  selector: 'app-resource-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './resource-form-dialog.component.html',
  styles: `
    .error {
      color: var(--app-color-error);
      margin: var(--app-space-2) 0 0;
    }
  `,
})
export class ResourceFormDialogComponent<T extends Entity> {
  protected readonly data = inject<ResourceDialogData<T>>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<ResourceFormDialogComponent<T>, T>>(MatDialogRef);

  protected readonly fields = this.data.config.fields.filter(
    (f) => !f.onlyIn || f.onlyIn === (this.data.item ? 'edit' : 'create'),
  );
  protected readonly form: ResourceForm = this.buildForm();
  protected readonly saving = signal(false);
  protected readonly attempted = signal(false);
  protected readonly serverError = signal('');
  private readonly options = this.loadOptions();

  protected get heading(): string {
    const { mode, config } = this.data;
    return mode === 'create'
      ? `Add ${config.singular}`
      : mode === 'edit'
        ? `Edit ${config.singular}`
        : `${config.singular} details`;
  }

  constructor() {
    if (this.data.mode === 'view') this.form.disable();
  }

  protected optionsOf(field: ResourceField<T>): readonly Option[] {
    return this.options[field.key]?.() ?? [];
  }

  protected errorOf(key: string): string {
    return errorMessage(this.form.controls[key]);
  }

  protected submit(): void {
    if (this.saving()) return;
    this.attempted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.serverError.set('');
    const { config, item } = this.data;
    let value: Record<string, unknown>;
    try {
      value = config.normalize ? config.normalize(this.extract(), item) : this.extract();
    } catch (e: unknown) {
      this.serverError.set(toErrorMessage(e));
      this.saving.set(false);
      return;
    }
    // The generic form produces a plain record; the repository contract expects the entity shape.
    const input = value as unknown as Omit<T, 'id'>;
    const save$: Observable<T> = item
      ? config.repository.update(item.id, input)
      : config.repository.create(input);

    save$
      .pipe(
        switchMap((saved) =>
          (config.afterSave ? config.afterSave(saved, item) : of(null)).pipe(
            toArray(),
            map(() => saved),
          ),
        ),
      )
      .subscribe({
        next: (saved) => this.dialogRef.close(saved),
        error: (e: unknown) => {
          this.serverError.set(toErrorMessage(e));
          this.saving.set(false);
        },
      });
  }

  private buildForm(): ResourceForm {
    const controls: Record<string, FormControl<FieldValue>> = {};
    const record = this.data.item as unknown as Record<string, unknown> | null;
    for (const f of this.fields) {
      controls[f.key] = new FormControl<FieldValue>(this.initial(f, record), {
        validators: this.validatorsFor(f),
      });
    }
    return new FormGroup(controls);
  }

  private initial(f: ResourceField<T>, record: Record<string, unknown> | null): FieldValue {
    const raw = record?.[f.key];
    if (f.type === 'date') return typeof raw === 'string' && raw ? fromIsoDate(raw) : null;
    if (raw === undefined || raw === null)
      return f.defaultValue ?? (f.type === 'number' ? null : '');
    return typeof raw === 'number' ? raw : String(raw);
  }

  private validatorsFor(f: ResourceField<T>): ValidatorFn[] {
    const v: ValidatorFn[] = [];
    if (f.required) v.push(Validators.required);
    if (f.required && (f.type === 'text' || f.type === 'textarea')) v.push(notBlank);
    if (f.type === 'email') v.push(Validators.email);
    if (f.type === 'tel') v.push(phoneNumber);
    if (f.maxLength) v.push(Validators.maxLength(f.maxLength));
    if (f.min !== undefined) v.push(Validators.min(f.min));
    if (f.max !== undefined) v.push(Validators.max(f.max));
    if (f.pattern) v.push(Validators.pattern(f.pattern));
    return v;
  }

  private extract(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of this.fields) {
      const v = this.form.controls[f.key].value;
      if (v instanceof Date) out[f.key] = toIsoDate(v);
      else if (typeof v === 'string') out[f.key] = v.trim();
      else if (typeof v === 'number') out[f.key] = v;
      else out[f.key] = f.type === 'number' ? 0 : '';
    }
    return out;
  }

  private loadOptions(): Record<string, Signal<readonly Option[]>> {
    const result: Record<string, Signal<readonly Option[]>> = {};
    for (const f of this.fields.filter((x) => x.type === 'select')) {
      const source = f.options;
      result[f.key] =
        typeof source === 'function'
          ? toSignal(source(this.data.item), { initialValue: [] as readonly Option[] })
          : signal(source ?? []);
    }
    return result;
  }

  protected invalid(control: AbstractControl | null): boolean {
    return !!control && control.invalid && control.touched;
  }
}
