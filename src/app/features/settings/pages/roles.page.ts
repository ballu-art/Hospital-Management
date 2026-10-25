import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ROLES, ROLE_LABELS, Role } from '../../../data-access/models/user';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  MODULE_KEYS,
  ModuleKey,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
} from '../../../core/auth/permissions';

const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  appointments: 'Appointments',
  doctors: 'Doctors',
  departments: 'Departments',
  admissions: 'Admissions & beds',
  billing: 'Billing',
  pharmacy: 'Pharmacy',
  laboratory: 'Laboratory',
  radiology: 'Radiology',
  inventory: 'Inventory & suppliers',
  employees: 'Employees',
  attendance: 'Attendance',
  leave: 'Leave',
  payroll: 'Payroll',
  reports: 'Reports',
  settings: 'Settings',
};

@Component({
  selector: 'app-roles-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header
      title="Roles & permissions"
      subtitle="Demo access matrix (UI only, not a security control)"
    />
    <section class="app-card">
      <div class="table-scroll">
        <table>
          <caption class="visually-hidden">
            Access level per module for each role
          </caption>
          <thead>
            <tr>
              <th scope="col">Module</th>
              @for (r of roles; track r) {
                <th scope="col">{{ labels[r] }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (m of modules; track m) {
              <tr>
                <th scope="row">{{ moduleLabels[m] }}</th>
                @for (r of roles; track r) {
                  <td>{{ level(r, m) }}</td>
                }
              </tr>
            }
            <tr>
              <th scope="row">Add diagnoses, prescriptions, notes</th>
              @for (r of roles; track r) {
                <td>{{ has(r, 'clinical:write') ? 'Yes' : '—' }}</td>
              }
            </tr>
            <tr>
              <th scope="row">Approve leave</th>
              @for (r of roles; track r) {
                <td>{{ has(r, 'leave:approve') ? 'Yes' : '—' }}</td>
              }
            </tr>
          </tbody>
        </table>
      </div>
      <dl>
        @for (r of roles; track r) {
          <dt>{{ labels[r] }}</dt>
          <dd>{{ descriptions[r] }}</dd>
        }
      </dl>
      <p class="text-muted">
        Real authorization must be enforced by the backend. These rules only decide what the demo UI
        shows.
      </p>
    </section>
  `,
  styles: `
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      padding: var(--app-space-2) var(--app-space-3);
      border-bottom: 1px solid var(--app-color-border);
      text-align: start;
    }
    thead th {
      color: var(--app-color-text-muted);
      font-weight: 500;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--app-space-2) var(--app-space-4);
      margin: var(--app-space-4) 0;
    }
    dd {
      margin: 0;
    }
  `,
})
export class RolesPage {
  protected readonly roles = ROLES;
  protected readonly labels = ROLE_LABELS;
  protected readonly descriptions = ROLE_DESCRIPTIONS;
  protected readonly modules = MODULE_KEYS;
  protected readonly moduleLabels = MODULE_LABELS;

  protected has(role: Role, permission: string): boolean {
    return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
  }

  protected level(role: Role, module: ModuleKey): string {
    return this.has(role, `${module}:write`)
      ? 'Read & write'
      : this.has(role, `${module}:read`)
        ? 'Read'
        : '—';
  }
}
