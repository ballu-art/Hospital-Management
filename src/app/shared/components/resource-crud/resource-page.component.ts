import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
  computed,
  inject,
  input,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, filter, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { toErrorMessage } from '../../models/app-error';
import { Entity } from '../../models/entity';
import { ListController } from '../../utils/list-controller';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';
import {
  DataTableComponent,
  PageChange,
  RowAction,
  RowActionEvent,
} from '../data-table/data-table.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { ErrorStateComponent } from '../error-state/error-state.component';
import { ListToolbarComponent } from '../list-toolbar/list-toolbar.component';
import { LoadingStateComponent } from '../loading-state/loading-state.component';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { ResourceConfig, ResourceToolbarAction } from './resource-config';
import {
  ResourceDialogData,
  ResourceDialogMode,
  ResourceFormDialogComponent,
} from './resource-form-dialog.component';

/** Generic list + CRUD page for starter modules, driven entirely by a ResourceConfig. */
@Component({
  selector: 'app-resource-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ListToolbarComponent,
    LoadingStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './resource-page.component.html',
  styles: `
    section {
      display: grid;
      gap: var(--app-space-3);
    }
    .app-card {
      padding: var(--app-space-4);
    }
  `,
})
export class ResourcePageComponent<T extends Entity> implements OnInit {
  readonly config = input.required<ResourceConfig<T>>();

  private readonly injector = inject(Injector);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly notify = inject(NotificationService);

  protected list!: ListController<T>;
  protected readonly busy = signal(false);

  protected readonly canWrite = computed(() => {
    const permission = this.config().writePermission;
    return !!permission && this.auth.can(permission);
  });
  protected readonly toolbarActions = computed<readonly ResourceToolbarAction[]>(() =>
    (this.config().toolbarActions ?? []).filter(
      (a) => !a.permission || this.auth.can(a.permission),
    ),
  );
  protected readonly rowActions = computed<readonly RowAction<T>[]>(() => {
    const c = this.config();
    const custom: RowAction<T>[] = (c.rowActions ?? [])
      .filter((a) => !a.permission || this.auth.can(a.permission))
      .map((a) => ({
        id: a.id,
        label: a.label,
        icon: a.icon,
        visible: a.visible,
        destructive: a.destructive,
      }));
    return this.canWrite()
      ? [
          ...custom,
          { id: '__edit', label: 'Edit', icon: 'edit' },
          {
            id: '__delete',
            label: 'Delete',
            icon: 'delete',
            destructive: true,
            visible: c.canDelete,
          },
        ]
      : [...custom, { id: '__view', label: 'View details', icon: 'visibility' }];
  });

  ngOnInit(): void {
    const c = this.config();
    runInInjectionContext(this.injector, () => {
      this.list = new ListController<T>(c.repository);
    });
    if (c.defaultSort) this.list.sort.set(c.defaultSort);
  }

  protected onPage(e: PageChange): void {
    this.list.setPage(e.pageIndex, e.pageSize);
  }

  protected onAction(e: RowActionEvent<T>): void {
    switch (e.id) {
      case '__edit':
        return this.openForm(e.row, 'edit');
      case '__view':
        return this.openForm(e.row, 'view');
      case '__delete':
        return this.remove(e.row);
      default:
        return this.runCustom(e);
    }
  }

  protected openForm(item: T | null, mode: ResourceDialogMode = item ? 'edit' : 'create'): void {
    const ref = this.dialog.open<ResourceFormDialogComponent<T>, ResourceDialogData<T>, T>(
      ResourceFormDialogComponent,
      { data: { config: this.config(), item, mode }, width: '720px', maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((saved) => {
      if (!saved) return;
      this.notify.success(`${this.config().singular} ${item ? 'updated' : 'added'}.`);
      this.list.reload();
    });
  }

  protected runToolbar(action: ResourceToolbarAction): void {
    this.perform(action.run(), (message) => this.notify.success(message));
  }

  private remove(row: T): void {
    const c = this.config();
    this.confirm
      .confirm({
        title: `Delete ${c.singular.toLowerCase()}?`,
        message: `“${c.itemLabel(row)}” will be removed from the demo data. This cannot be undone.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => c.repository.delete(row.id)),
      )
      .subscribe({
        next: () => {
          this.notify.success(`${c.singular} deleted.`);
          this.list.reload();
        },
        error: (e: unknown) => this.notify.error(toErrorMessage(e)),
      });
  }

  private runCustom(e: RowActionEvent<T>): void {
    const action = this.config().rowActions?.find((a) => a.id === e.id);
    if (!action) return;
    const start = () =>
      this.perform(action.run(e.row), () => this.notify.success(action.successMessage(e.row)));
    if (!action.confirm) return start();
    this.confirm
      .confirm({ ...action.confirm, destructive: action.destructive })
      .pipe(filter(Boolean))
      .subscribe(start);
  }

  private perform<R>(op: Observable<R>, onDone: (result: R) => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    op.subscribe({
      next: (result) => {
        onDone(result);
        this.list.reload();
      },
      error: (e: unknown) => {
        this.notify.error(toErrorMessage(e));
        this.busy.set(false);
      },
      complete: () => this.busy.set(false),
    });
  }
}
