import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { SortState } from '../../models/entity';
import { StatusChipComponent } from '../status-chip/status-chip.component';

export interface DataTableColumn<T> {
  readonly key: string;
  readonly header: string;
  readonly value: (row: T) => string | number;
  readonly sortable?: boolean;
  /** Render the value as a status chip. */
  readonly chip?: boolean;
  /** Render the value as a link to this route. */
  readonly link?: (row: T) => string;
  readonly align?: 'start' | 'end';
  /** Hide the column on narrow screens. */
  readonly hideBelow?: 'sm' | 'md';
}

export interface RowAction<T> {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly visible?: (row: T) => boolean;
  readonly destructive?: boolean;
}

export interface RowActionEvent<T> {
  readonly id: string;
  readonly row: T;
}

export interface PageChange {
  readonly pageIndex: number;
  readonly pageSize: number;
}

/**
 * Presentational, "controlled" table: the parent owns sorting and paging state (usually via a
 * ListController) and the table only renders it and reports user intent.
 */
@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    RouterLink,
    StatusChipComponent,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T> {
  readonly columns = input.required<readonly DataTableColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();
  readonly total = input.required<number>();
  readonly pageIndex = input(0);
  readonly pageSize = input(10);
  readonly sort = input<SortState | null>(null);
  readonly actions = input<readonly RowAction<T>[]>([]);
  readonly caption = input.required<string>();
  readonly pageSizeOptions = input<readonly number[]>([5, 10, 25]);

  readonly sortChange = output<SortState | null>();
  readonly pageChange = output<PageChange>();
  readonly action = output<RowActionEvent<T>>();

  protected readonly displayedColumns = computed(() => [
    ...this.columns().map((c) => c.key),
    ...(this.actions().length ? ['__actions'] : []),
  ]);

  protected onSort(event: Sort): void {
    this.sortChange.emit(
      event.direction ? { active: event.active, direction: event.direction } : null,
    );
  }

  protected onPage(event: PageEvent): void {
    this.pageChange.emit({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  protected visibleActions(row: T): readonly RowAction<T>[] {
    return this.actions().filter((a) => !a.visible || a.visible(row));
  }

  protected text(col: DataTableColumn<T>, row: T): string {
    return String(col.value(row));
  }
}
