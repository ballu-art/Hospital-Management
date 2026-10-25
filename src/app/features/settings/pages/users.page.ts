import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppUser, ROLES, ROLE_LABELS } from '../../../data-access/models/user';
import { USER_REPOSITORY } from '../../../data-access/repositories/repository-tokens';
import {
  ResourceConfig,
  staticOptions,
} from '../../../shared/components/resource-crud/resource-config';
import { ResourcePageComponent } from '../../../shared/components/resource-crud/resource-page.component';

@Component({
  selector: 'app-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePageComponent],
  template: `<app-resource-page [config]="config" />`,
})
export class UsersPage {
  protected readonly config: ResourceConfig<AppUser> = {
    title: 'Users',
    singular: 'User',
    subtitle: 'Demo user accounts and their roles (no credentials are stored)',
    icon: 'manage_accounts',
    searchLabel: 'Search by name, email or role',
    repository: inject(USER_REPOSITORY),
    writePermission: 'settings:write',
    itemLabel: (u) => u.name,
    filters: [
      {
        key: 'role',
        label: 'Role',
        options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
      },
    ],
    columns: [
      { key: 'name', header: 'Name', value: (u) => u.name, sortable: true },
      { key: 'email', header: 'Email', value: (u) => u.email, hideBelow: 'sm' },
      { key: 'role', header: 'Role', value: (u) => ROLE_LABELS[u.role], sortable: true },
      { key: 'status', header: 'Status', value: (u) => u.status, chip: true, sortable: true },
    ],
    fields: [
      { key: 'name', label: 'Full name', type: 'text', required: true, maxLength: 60 },
      { key: 'email', label: 'Email', type: 'email', required: true },
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        required: true,
        options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: staticOptions(['Active', 'Disabled']),
        defaultValue: 'Active',
      },
    ],
  };
}
