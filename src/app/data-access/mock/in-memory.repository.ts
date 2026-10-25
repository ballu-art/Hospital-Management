import { inject } from '@angular/core';
import { Observable, defer, of, delay } from 'rxjs';
import { AppError } from '../../shared/models/app-error';
import { Entity, ListQuery, Page } from '../../shared/models/entity';
import { Repository } from '../repositories/repository';
import { MockControl } from './mock-control.service';

export interface InMemoryOptions<T extends Entity, TCreate> {
  readonly idPrefix: string;
  /** Text matched (case-insensitively) by the list search box. */
  readonly searchText: (item: T) => string;
  /** Custom sort accessors for derived columns, keyed by column key. */
  readonly sortValues?: Readonly<Record<string, (item: T) => string | number>>;
  /** Custom filter logic (e.g. date ranges), keyed by filter key. Default is string equality. */
  readonly filterPredicates?: Readonly<Record<string, (item: T, value: string) => boolean>>;
  readonly build?: (input: TCreate, id: string) => T;
  /** Throw an AppError to reject a candidate (domain rules enforced by the data layer). */
  readonly validate?: (candidate: T, others: readonly T[]) => void;
}

/**
 * Deterministic in-memory repository. State is immutable (arrays are replaced, never mutated)
 * and lives only for the current page session: a browser reload restores the seed data.
 */
export class InMemoryRepository<T extends Entity, TCreate = Omit<T, 'id'>> implements Repository<
  T,
  TCreate
> {
  private readonly control = inject(MockControl);
  private items: readonly T[];
  private sequence: number;

  constructor(
    seed: readonly T[],
    private readonly options: InMemoryOptions<T, TCreate>,
  ) {
    this.items = [...seed];
    this.sequence = seed.reduce((max, s) => Math.max(max, Number(s.id.split('-').pop()) || 0), 0);
  }

  protected get snapshot(): readonly T[] {
    return this.items;
  }

  /** Wraps a synchronous operation so it behaves like an async API call. */
  protected respond<R>(produce: () => R): Observable<R> {
    return defer(() => {
      this.control.beforeRequest();
      const result = produce();
      const ms = this.control.latencyMs();
      return ms > 0 ? of(result).pipe(delay(ms)) : of(result);
    });
  }

  list(query: ListQuery): Observable<Page<T>> {
    return this.respond(() => {
      let rows = [...this.items];
      const terms = (query.search ?? '').toLowerCase().split(/\s+/).filter(Boolean);
      if (terms.length) {
        rows = rows.filter((r) => {
          const text = this.options.searchText(r).toLowerCase();
          return terms.every((t) => text.includes(t));
        });
      }
      for (const [key, value] of Object.entries(query.filters ?? {})) {
        if (!value) continue;
        const custom = this.options.filterPredicates?.[key];
        rows = rows.filter((r) =>
          custom ? custom(r, value) : String(this.read(r, key)) === value,
        );
      }
      if (query.sort?.active) {
        const { active, direction } = query.sort;
        const factor = direction === 'asc' ? 1 : -1;
        rows.sort((a, b) => factor * this.compare(this.read(a, active), this.read(b, active)));
      }
      const start = query.pageIndex * query.pageSize;
      return {
        items: rows.slice(start, start + query.pageSize),
        total: rows.length,
        pageIndex: query.pageIndex,
        pageSize: query.pageSize,
      };
    });
  }

  all(): Observable<readonly T[]> {
    return this.respond(() => this.items);
  }

  get(id: string): Observable<T> {
    return this.respond(() => this.find(id));
  }

  create(input: TCreate): Observable<T> {
    return this.respond(() => {
      const id = `${this.options.idPrefix}-${String(this.sequence + 1).padStart(4, '0')}`;
      const entity = this.options.build
        ? this.options.build(input, id)
        : ({ ...(input as object), id } as T);
      this.options.validate?.(entity, this.items);
      this.sequence += 1;
      this.items = [...this.items, entity];
      return entity;
    });
  }

  update(id: string, changes: Partial<TCreate>): Observable<T> {
    return this.respond(() => {
      const existing = this.find(id);
      const updated: T = { ...existing, ...(changes as object) };
      this.options.validate?.(
        updated,
        this.items.filter((i) => i.id !== id),
      );
      this.items = this.items.map((i) => (i.id === id ? updated : i));
      return updated;
    });
  }

  delete(id: string): Observable<void> {
    return this.respond(() => {
      this.find(id);
      this.items = this.items.filter((i) => i.id !== id);
    });
  }

  private find(id: string): T {
    const found = this.items.find((i) => i.id === id);
    if (!found) throw new AppError('not-found', 'The requested record was not found.');
    return found;
  }

  private read(item: T, key: string): string | number {
    const custom = this.options.sortValues?.[key];
    if (custom) return custom(item);
    const value = (item as unknown as Record<string, unknown>)[key];
    return typeof value === 'number' ? value : String(value ?? '');
  }

  private compare(a: string | number, b: string | number): number {
    return typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  }
}
