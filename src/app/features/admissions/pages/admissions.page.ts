import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { AppError } from '../../../shared/models/app-error';
import { doctorFullName } from '../../../data-access/models/appointment';
import { Admission, VISIT_STATUSES, VISIT_TYPES } from '../../../data-access/models/operations';
import { patientFullName } from '../../../data-access/models/patient';
import { PATIENT_REPOSITORY } from '../../../data-access/repositories/patient.repository';
import {
  ADMISSION_REPOSITORY,
  BED_REPOSITORY,
  DOCTOR_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { toIsoDate } from '../../../shared/utils/date';
import { createLookup } from '../../../shared/utils/lookup';

/** OPD / IPD visits, discharge and bed allocation. */
@Component({
  selector: 'app-admissions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class AdmissionsPage {
  private readonly repo = inject(ADMISSION_REPOSITORY);
  private readonly bedRepo = inject(BED_REPOSITORY);
  private readonly patients = createLookup(inject(PATIENT_REPOSITORY), patientFullName);
  private readonly doctors = createLookup(inject(DOCTOR_REPOSITORY), doctorFullName);
  private readonly beds = createLookup(this.bedRepo, (b) => `${b.number} (${b.ward})`);

  protected readonly config: ResourceConfig<Admission> = {
    title: 'OPD / IPD visits',
    singular: 'Visit',
    subtitle: 'Outpatient visits, inpatient admissions, discharge and bed allocation',
    icon: 'assignment_ind',
    searchLabel: 'Search by diagnosis or visit type',
    repository: this.repo,
    itemLabel: (a) => `${this.patients.label(a.patientId)} – ${a.type}`,
    defaultSort: { active: 'admittedOn', direction: 'desc' },
    filters: [
      { key: 'type', label: 'Type', options: VISIT_TYPES.map((s) => ({ value: s, label: s })) },
      {
        key: 'status',
        label: 'Status',
        options: VISIT_STATUSES.map((s) => ({ value: s, label: s })),
      },
    ],
    columns: [
      { key: 'patientId', header: 'Patient', value: (a) => this.patients.label(a.patientId) },
      { key: 'type', header: 'Type', value: (a) => a.type, sortable: true },
      {
        key: 'doctorId',
        header: 'Doctor',
        value: (a) => this.doctors.label(a.doctorId),
        hideBelow: 'md',
      },
      {
        key: 'admittedOn',
        header: 'Admitted',
        value: (a) => a.admittedOn,
        sortable: true,
        hideBelow: 'sm',
      },
      {
        key: 'bedId',
        header: 'Bed',
        value: (a) => (a.bedId ? this.beds.label(a.bedId) : '—'),
        hideBelow: 'sm',
      },
      { key: 'status', header: 'Status', value: (a) => a.status, chip: true, sortable: true },
    ],
    ...this.writable(),
    rowActions: [
      {
        id: 'discharge',
        label: 'Discharge',
        icon: 'logout',
        visible: (a) => a.status === 'Open',
        confirm: {
          title: 'Discharge patient?',
          message: 'The visit will be closed and any allocated bed released.',
          confirmLabel: 'Discharge',
        },
        run: (a) =>
          this.repo
            .update(a.id, { status: 'Discharged', dischargedOn: toIsoDate(new Date()) })
            .pipe(
              switchMap(() =>
                a.bedId ? this.bedRepo.update(a.bedId, { status: 'Available' }) : of(null),
              ),
            ),
        successMessage: () => 'Patient discharged.',
      },
    ],
  };

  private writable(): Required<
    Pick<
      ResourceConfig<Admission>,
      'writePermission' | 'fields' | 'canDelete' | 'normalize' | 'afterSave'
    >
  > {
    return {
      writePermission: 'admissions:write',
      canDelete: (a) => !(a.status === 'Open' && a.bedId),
      fields: [
        {
          key: 'patientId',
          label: 'Patient',
          type: 'select',
          required: true,
          options: () => this.patients.options$,
        },
        {
          key: 'doctorId',
          label: 'Doctor',
          type: 'select',
          required: true,
          options: () => this.doctors.options$,
        },
        {
          key: 'type',
          label: 'Visit type',
          type: 'select',
          required: true,
          options: staticOptions(VISIT_TYPES),
          defaultValue: 'OPD',
        },
        {
          key: 'admittedOn',
          label: 'Admitted on',
          type: 'date',
          required: true,
          defaultValue: new Date(),
        },
        {
          key: 'bedId',
          label: 'Bed (inpatients)',
          type: 'select',
          options: (current) =>
            this.bedRepo
              .all()
              .pipe(
                map((list) =>
                  list
                    .filter((b) => b.status === 'Available' || b.id === current?.bedId)
                    .map((b) => ({ value: b.id, label: `${b.number} – ${b.ward} (${b.type})` })),
                ),
              ),
        },
        {
          key: 'diagnosis',
          label: 'Diagnosis / reason',
          type: 'text',
          required: true,
          maxLength: 120,
          fullWidth: true,
        },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: staticOptions(VISIT_STATUSES),
          onlyIn: 'edit',
        },
        { key: 'dischargedOn', label: 'Discharged on', type: 'date', onlyIn: 'edit' },
      ],
      normalize: (v, prev) => {
        const doctor = this.doctors.items().get(String(v['doctorId']));
        const type = String(v['type']);
        const status = prev ? String(v['status']) : 'Open';
        if (type === 'IPD' && status === 'Open' && !v['bedId']) {
          throw new AppError('validation', 'Allocate a bed for inpatient admissions.');
        }
        return {
          ...v,
          status,
          departmentId: doctor?.departmentId ?? prev?.departmentId ?? '',
          bedId: type === 'IPD' ? v['bedId'] : '',
          dischargedOn: status === 'Discharged' ? v['dischargedOn'] || toIsoDate(new Date()) : '',
        };
      },
      afterSave: (saved, prev): Observable<unknown> => {
        const before = prev?.status === 'Open' ? prev.bedId : '';
        const after = saved.status === 'Open' ? saved.bedId : '';
        const ops: Observable<unknown>[] = [];
        if (before && before !== after)
          ops.push(this.bedRepo.update(before, { status: 'Available' }));
        if (after && after !== before) ops.push(this.bedRepo.update(after, { status: 'Occupied' }));
        return ops.length ? forkJoin(ops) : of(null);
      },
    };
  }
}
