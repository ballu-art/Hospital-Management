import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { PAYROLL_STATUSES, PayrollRecord, employeeFullName } from '../../../data-access/models/hr';
import { buildPayroll, previousMonth } from '../../../data-access/mock/mock-data-hr';
import {
  EMPLOYEE_REPOSITORY,
  PAYROLL_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { AppError } from '../../../shared/models/app-error';
import { formatMoney } from '../../../shared/utils/format';
import { createLookup } from '../../../shared/utils/lookup';

@Component({
  selector: 'app-payroll-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class PayrollPage {
  private readonly repo = inject(PAYROLL_REPOSITORY);
  private readonly employeeRepo = inject(EMPLOYEE_REPOSITORY);
  private readonly employees = createLookup(this.employeeRepo, employeeFullName);

  protected readonly config: ResourceConfig<PayrollRecord> = {
    title: 'Payroll',
    singular: 'Payroll record',
    subtitle: 'Monthly pay calculation. Figures are fictional and for demonstration only.',
    icon: 'payments',
    searchLabel: 'Search by month (YYYY-MM) or status',
    repository: this.repo,
    writePermission: 'payroll:write',
    itemLabel: (p) => `${this.employees.label(p.employeeId)} ${p.month}`,
    defaultSort: { active: 'month', direction: 'desc' },
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: PAYROLL_STATUSES.map((s) => ({ value: s, label: s })),
      },
    ],
    columns: [
      { key: 'month', header: 'Month', value: (p) => p.month, sortable: true },
      { key: 'employeeId', header: 'Employee', value: (p) => this.employees.label(p.employeeId) },
      {
        key: 'basic',
        header: 'Basic',
        value: (p) => formatMoney(p.basic),
        align: 'end',
        hideBelow: 'md',
      },
      {
        key: 'deductions',
        header: 'Deductions',
        value: (p) => formatMoney(p.deductions),
        align: 'end',
        hideBelow: 'md',
      },
      {
        key: 'netPay',
        header: 'Net pay',
        value: (p) => formatMoney(p.netPay),
        sortable: true,
        align: 'end',
      },
      { key: 'status', header: 'Status', value: (p) => p.status, chip: true, sortable: true },
    ],
    fields: [
      {
        key: 'employeeId',
        label: 'Employee',
        type: 'select',
        required: true,
        options: () => this.employees.options$,
      },
      {
        key: 'month',
        label: 'Pay month',
        type: 'text',
        required: true,
        pattern: /^\d{4}-(0[1-9]|1[0-2])$/,
        hint: 'Format YYYY-MM',
      },
      { key: 'basic', label: 'Basic pay', type: 'number', required: true, min: 0 },
      {
        key: 'allowances',
        label: 'Allowances',
        type: 'number',
        required: true,
        min: 0,
        defaultValue: 0,
      },
      {
        key: 'deductions',
        label: 'Deductions',
        type: 'number',
        required: true,
        min: 0,
        defaultValue: 0,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: staticOptions(PAYROLL_STATUSES),
        defaultValue: 'Draft',
      },
    ],
    normalize: (v) => {
      const netPay = Number(v['basic']) + Number(v['allowances']) - Number(v['deductions']);
      if (netPay < 0)
        throw new AppError('validation', 'Deductions cannot exceed pay plus allowances.');
      return { ...v, netPay };
    },
    toolbarActions: [
      {
        id: 'generate',
        label: 'Generate last month’s payroll',
        icon: 'auto_awesome',
        permission: 'payroll:write',
        run: () => {
          const month = previousMonth();
          return forkJoin({ employees: this.employeeRepo.all(), existing: this.repo.all() }).pipe(
            map(({ employees, existing }) => {
              const done = new Set(
                existing.filter((p) => p.month === month).map((p) => p.employeeId),
              );
              return employees.filter((e) => e.status !== 'Inactive' && !done.has(e.id));
            }),
            switchMap((todo) =>
              todo.length
                ? forkJoin(todo.map((e) => this.repo.create(buildPayroll(e, month)))).pipe(
                    map(
                      () => `Generated ${String(todo.length)} draft payroll records for ${month}.`,
                    ),
                  )
                : of(`Payroll for ${month} is already generated.`),
            ),
          );
        },
      },
    ],
  };
}
