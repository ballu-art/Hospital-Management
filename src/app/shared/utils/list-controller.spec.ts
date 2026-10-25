import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { AppError } from '../models/app-error';
import { ListQuery, Page } from '../models/entity';
import { ListController, ListSource } from './list-controller';

const ROWS = Array.from({ length: 25 }, (_, i) => ({
  id: String(i),
  name: i % 2 ? `odd ${String(i)}` : `even ${String(i)}`,
}));

function source(): ListSource<{ id: string; name: string }> & {
  calls: ListQuery[];
  fail: boolean;
} {
  const s = {
    calls: [] as ListQuery[],
    fail: false,
    list(q: ListQuery): Observable<Page<{ id: string; name: string }>> {
      s.calls.push(q);
      if (s.fail) return throwError(() => new AppError('simulated', 'Boom'));
      const rows = ROWS.filter((r) => r.name.includes(q.search ?? ''));
      return of({
        items: rows.slice(q.pageIndex * q.pageSize, (q.pageIndex + 1) * q.pageSize),
        total: rows.length,
        pageIndex: q.pageIndex,
        pageSize: q.pageSize,
      });
    },
  };
  return s;
}

describe('ListController', () => {
  const create = (src: ListSource<{ id: string; name: string }>) =>
    runInInjectionContext(
      TestBed.inject(Injector),
      () => new ListController(src, { pageSize: 10, debounceMs: 0 }),
    );

  it('starts in loading and then shows the first page', () => {
    const list = create(source());
    expect(list.status()).toBe('loading');
    TestBed.tick();
    expect(list.status()).toBe('ready');
    expect(list.items()).toHaveLength(10);
    expect(list.total()).toBe(25);
  });

  it('paginates and resets to the first page when searching', () => {
    const list = create(source());
    TestBed.tick();
    list.setPage(2, 10);
    TestBed.tick();
    expect(list.items()).toHaveLength(5);
    list.applySearch('odd');
    TestBed.tick();
    expect(list.pageIndex()).toBe(0);
    expect(list.total()).toBe(12);
    expect(list.hasCriteria()).toBe(true);
  });

  it('exposes an empty state for searches without results and clears criteria', () => {
    const list = create(source());
    TestBed.tick();
    list.applySearch('zzz');
    TestBed.tick();
    expect(list.isEmpty()).toBe(true);
    list.clearCriteria();
    TestBed.tick();
    expect(list.isEmpty()).toBe(false);
    expect(list.total()).toBe(25);
  });

  it('exposes a recoverable error state', () => {
    const src = source();
    src.fail = true;
    const list = create(src);
    TestBed.tick();
    expect(list.status()).toBe('error');
    expect(list.error()).toContain('Boom');
    src.fail = false;
    list.reload();
    TestBed.tick();
    expect(list.status()).toBe('ready');
  });

  it('steps back a page when the last page becomes empty', () => {
    const src = source();
    const list = create(src);
    TestBed.tick();
    list.setPage(2, 10);
    TestBed.tick();
    ROWS.splice(20, 5);
    list.reload();
    TestBed.tick();
    TestBed.tick();
    expect(list.pageIndex()).toBe(1);
    expect(list.items()).toHaveLength(10);
  });
});
