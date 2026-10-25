import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Appointment, doctorFullName } from '../../../data-access/models/appointment';
import {
  CLINICAL_RECORD_TYPES,
  ClinicalRecord,
  ClinicalRecordType,
} from '../../../data-access/models/clinical';
import { Bill } from '../../../data-access/models/operations';
import { Patient, patientFullName } from '../../../data-access/models/patient';
import { APPOINTMENT_REPOSITORY } from '../../../data-access/repositories/appointment.repository';
import { BILL_REPOSITORY } from '../../../data-access/repositories/bill.repository';
import { CLINICAL_RECORD_REPOSITORY } from '../../../data-access/repositories/clinical-record.repository';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
import { DOCTOR_REPOSITORY } from '../../../data-access/repositories/repository-tokens';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { toErrorMessage } from '../../../shared/models/app-error';
import { AgePipe } from '../../../shared/pipes/age.pipe';
import { toIsoDate } from '../../../shared/utils/date';
import { CURRENCY_CODE } from '../../../shared/utils/format';
import { createLookup } from '../../../shared/utils/lookup';
import { notBlank } from '../../../shared/validators/app-validators';

@Component({
  selector: 'app-patient-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    RouterLink,
    AgePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    StatusChipComponent,
  ],
  templateUrl: './patient-detail.page.html',
  styleUrl: './patient-detail.page.scss',
})
export class PatientDetailPage implements OnInit {
  readonly id = input.required<string>();

  private readonly patients = inject(PATIENT_REPOSITORY);
  private readonly appointmentsRepo = inject(APPOINTMENT_REPOSITORY);
  private readonly billsRepo = inject(BILL_REPOSITORY);
  private readonly clinicalRepo = inject(CLINICAL_RECORD_REPOSITORY);
  private readonly notify = inject(NotificationService);
  protected readonly auth = inject(AuthService);

  protected readonly doctors = createLookup(inject(DOCTOR_REPOSITORY), doctorFullName);
  protected readonly currency = CURRENCY_CODE;
  protected readonly recordTypes = CLINICAL_RECORD_TYPES;
  protected readonly fullName = patientFullName;

  protected readonly patient = signal<Patient | null>(null);
  protected readonly appointments = signal<readonly Appointment[]>([]);
  protected readonly bills = signal<readonly Bill[]>([]);
  protected readonly records = signal<readonly ClinicalRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly savingRecord = signal(false);

  protected readonly billing = computed(() => {
    const b = this.bills();
    const billed = b.reduce((s, x) => s + x.amount, 0);
    const paid = b.reduce((s, x) => s + x.paidAmount, 0);
    return { billed, paid, balance: billed - paid };
  });

  protected readonly recordForm = new FormGroup({
    type: new FormControl<ClinicalRecordType>('Diagnosis', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    doctorId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(100)],
    }),
    details: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(500)],
    }),
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    const id = this.id();
    forkJoin({
      patient: this.patients.get(id),
      appointments: this.auth.can('appointments:read')
        ? this.appointmentsRepo.listForPatient(id)
        : of([] as readonly Appointment[]),
      bills: this.auth.can('billing:read')
        ? this.billsRepo.listForPatient(id)
        : of([] as readonly Bill[]),
      records: this.clinicalRepo.listForPatient(id),
    }).subscribe({
      next: (r) => {
        this.patient.set(r.patient);
        this.appointments.set(r.appointments);
        this.bills.set(r.bills);
        this.records.set(r.records);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.error.set(toErrorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected addRecord(): void {
    if (this.savingRecord()) return;
    this.recordForm.markAllAsTouched();
    if (this.recordForm.invalid) return;
    this.savingRecord.set(true);
    const v = this.recordForm.getRawValue();
    this.clinicalRepo
      .create({
        ...v,
        title: v.title.trim(),
        details: v.details.trim(),
        patientId: this.id(),
        recordedOn: toIsoDate(new Date()),
      })
      .subscribe({
        next: (rec) => {
          this.records.update((r) => [rec, ...r]);
          this.recordForm.reset({ type: v.type, doctorId: v.doctorId, title: '', details: '' });
          this.savingRecord.set(false);
          this.notify.success(`${rec.type} added.`);
        },
        error: (e: unknown) => {
          this.notify.error(toErrorMessage(e));
          this.savingRecord.set(false);
        },
      });
  }
}
