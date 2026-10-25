import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EMPLOYEE_STATUSES, Employee, employeeFullName } from '../../../data-access/models/hr';
import {
  DEPARTMENT_REPOSITORY,
  EMPLOYEE_REPOSITORY,
} from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';
import { formatMoney } from '../../../shared/utils/format';
import { createLookup } from '../../../shared/utils/lookup';

@Component({
  selector: 'app-employees-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class EmployeesPage {
  private readonly departments = createLookup(inject(DEPARTMENT_REPOSITORY), (d) => d.name);

  protected readonly config: ResourceConfig<Employee> = {
    title: 'Employees',
    singular: 'Employee',
    subtitle: 'Digital employee records (fictional demo data)',
    icon: 'badge',
    searchLabel: 'Search by name, code or designation',
    repository: inject(EMPLOYEE_REPOSITORY),
    writePermission: 'employees:write',
    itemLabel: employeeFullName,
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: EMPLOYEE_STATUSES.map((s) => ({ value: s, label: s })),
      },
    ],
    columns: [
      {
        key: 'employeeCode',
        header: 'Code',
        value: (e) => e.employeeCode,
        sortable: true,
        hideBelow: 'sm',
      },
      { key: 'lastName', header: 'Name', value: employeeFullName, sortable: true },
      {
        key: 'designation',
        header: 'Designation',
        value: (e) => e.designation,
        sortable: true,
        hideBelow: 'sm',
      },
      {
        key: 'departmentId',
        header: 'Department',
        value: (e) => this.departments.label(e.departmentId),
        hideBelow: 'md',
      },
      {
        key: 'monthlySalary',
        header: 'Monthly salary',
        value: (e) => formatMoney(e.monthlySalary),
        align: 'end',
        hideBelow: 'md',
      },
      { key: 'status', header: 'Status', value: (e) => e.status, chip: true, sortable: true },
    ],
    fields: [
      { key: 'employeeCode', label: 'Employee code', type: 'text', required: true, maxLength: 20 },
      { key: 'firstName', label: 'First name', type: 'text', required: true, maxLength: 50 },
      { key: 'lastName', label: 'Last name', type: 'text', required: true, maxLength: 50 },
      { key: 'designation', label: 'Designation', type: 'text', required: true, maxLength: 60 },
      {
        key: 'departmentId',
        label: 'Department',
        type: 'select',
        required: true,
        options: () => this.departments.options$,
      },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone', type: 'tel', required: true },
      {
        key: 'joinedOn',
        label: 'Joined on',
        type: 'date',
        required: true,
        defaultValue: new Date(),
      },
      { key: 'monthlySalary', label: 'Monthly salary', type: 'number', required: true, min: 0 },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: staticOptions(EMPLOYEE_STATUSES),
        defaultValue: 'Active',
      },
    ],
  };
}
