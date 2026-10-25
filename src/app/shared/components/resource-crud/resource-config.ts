import { Observable } from 'rxjs';
import { Permission } from '../../../core/auth/permissions';
import { Entity, Option } from '../../models/entity';
import { Repository } from '../../../data-access/repositories/repository';
import { DataTableColumn } from '../data-table/data-table.component';
import { ListFilter } from '../list-toolbar/list-toolbar.component';

export type FieldType =
  'text' | 'email' | 'tel' | 'textarea' | 'number' | 'date' | 'time' | 'select';
export type FieldValue = string | number | Date | null;

export interface ResourceField<T extends Entity> {
  readonly key: string;
  readonly label: string;
  readonly type: FieldType;
  readonly required?: boolean;
  /** Static options, or a function so options can depend on the record being edited. */
  readonly options?: readonly Option[] | ((item: T | null) => Observable<readonly Option[]>);
  readonly min?: number;
  readonly max?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly hint?: string;
  readonly fullWidth?: boolean;
  /** Only show this field when creating or when editing. */
  readonly onlyIn?: 'create' | 'edit';
  readonly defaultValue?: FieldValue;
}

export interface ResourceRowAction<T extends Entity> {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly visible?: (row: T) => boolean;
  readonly permission?: Permission;
  readonly destructive?: boolean;
  readonly confirm?: {
    readonly title: string;
    readonly message: string;
    readonly confirmLabel: string;
  };
  readonly run: (row: T) => Observable<unknown>;
  readonly successMessage: (row: T) => string;
}

export interface ResourceToolbarAction {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly permission?: Permission;
  /** Emits the success message. */
  readonly run: () => Observable<string>;
}

/**
 * Declarative description of a starter CRUD module. The generic ResourcePage renders the list,
 * search, filters, paging, form dialog, confirmations, notifications and loading/empty/error
 * states from this object. Business rules live in the hooks, not in the page component.
 */
export interface ResourceConfig<T extends Entity> {
  readonly title: string;
  readonly singular: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly searchLabel: string;
  readonly repository: Repository<T>;
  /** Permission needed to create, edit and delete. `null` makes the module read-only. */
  readonly writePermission: Permission | null;
  readonly columns: readonly DataTableColumn<T>[];
  readonly fields: readonly ResourceField<T>[];
  readonly filters?: readonly ListFilter[];
  /** Return false to hide the Delete action for a row (e.g. records with dependants). */
  readonly canDelete?: (item: T) => boolean;
  readonly itemLabel: (item: T) => string;
  readonly defaultSort?: { active: string; direction: 'asc' | 'desc' };
  readonly rowActions?: readonly ResourceRowAction<T>[];
  readonly toolbarActions?: readonly ResourceToolbarAction[];
  /** Adjust or derive values (e.g. totals, status) before saving. */
  readonly normalize?: (
    value: Record<string, unknown>,
    previous: T | null,
  ) => Record<string, unknown>;
  /** Side effects after a successful save (e.g. update a related bed). */
  readonly afterSave?: (saved: T, previous: T | null) => Observable<unknown>;
}

export const staticOptions = (values: readonly string[]): readonly Option[] =>
  values.map((v) => ({ value: v, label: v }));
