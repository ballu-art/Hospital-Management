import { computed, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { toErrorMessage } from '../models/app-error';
import { ListQuery, Page, SortState } from '../models/entity';

export interface ListSource<T> {
  list(query: ListQuery): Observable<Page<T>>;
}

export type ListStatus = 'loading' | 'ready' | 'error';

/**
 * Signal-based state holder for server-style lists: search, filters, sort and paging in,
 * items and loading/empty/error state out. Create it in an injection context.
 */
export class ListController<T> {
  readonly search = signal('');
  readonly filters = signal<Readonly<Record<string, string>>>({});
  readonly sort = signal<SortState | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly status = signal<ListStatus>('loading');
  readonly items = signal<readonly T[]>([]);
  readonly total = signal(0);
  readonly error = signal('');

  readonly hasCriteria = computed(
    () => this.search().trim() !== '' || Object.values(this.filters()).some(Boolean),
  );
  readonly isEmpty = computed(() => this.status() === 'ready' && this.total() === 0);

  private readonly reloadTick = signal(0);
  private readonly searchInput = new Subject<string>();

  constructor(source: ListSource<T>, options: { pageSize?: number; debounceMs?: number } = {}) {
    if (options.pageSize) this.pageSize.set(options.pageSize);

    this.searchInput
      .pipe(debounceTime(options.debounceMs ?? 250), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => this.applySearch(value));

    const request = computed(() => ({
      query: {
        search: this.search(),
        filters: this.filters(),
        sort: this.sort(),
        pageIndex: this.pageIndex(),
        pageSize: this.pageSize(),
      } satisfies ListQuery,
      tick: this.reloadTick(),
    }));

    toObservable(request)
      .pipe(
        tap(() => this.status.set('loading')),
        switchMap(({ query }) =>
          source.list(query).pipe(
            map((page) => ({ page, error: null as string | null })),
            catchError((e: unknown) => of({ page: null, error: toErrorMessage(e) })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ page, error }) => {
        if (!page) {
          this.error.set(error ?? '');
          this.status.set('error');
          return;
        }
        // Deleting the last row of the last page: step back one page.
        if (page.items.length === 0 && page.total > 0 && page.pageIndex > 0) {
          this.pageIndex.set(Math.max(0, Math.ceil(page.total / page.pageSize) - 1));
          return;
        }
        this.items.set(page.items);
        this.total.set(page.total);
        this.error.set('');
        this.status.set('ready');
      });
  }

  /** Debounced search (for typing). */
  typeSearch(value: string): void {
    this.searchInput.next(value);
  }

  /** Immediate search (for programmatic changes such as a query parameter). */
  applySearch(value: string): void {
    if (value === this.search()) return;
    this.search.set(value);
    this.pageIndex.set(0);
  }

  setFilter(key: string, value: string): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    this.pageIndex.set(0);
  }

  setSort(sort: SortState | null): void {
    this.sort.set(sort);
    this.pageIndex.set(0);
  }

  setPage(pageIndex: number, pageSize: number): void {
    this.pageSize.set(pageSize);
    this.pageIndex.set(pageIndex);
  }

  clearCriteria(): void {
    this.search.set('');
    this.filters.set({});
    this.pageIndex.set(0);
  }

  reload(): void {
    this.reloadTick.update((n) => n + 1);
  }
}
