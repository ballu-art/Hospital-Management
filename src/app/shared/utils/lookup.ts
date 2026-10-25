import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { Entity, Option } from '../models/entity';

export interface Lookup<T extends Entity> {
  /** Entities by id (empty until loaded). */
  readonly items: Signal<ReadonlyMap<string, T>>;
  /** Label for an id, or an em dash when unknown. */
  readonly label: (id: string) => string;
  readonly options$: Observable<readonly Option[]>;
}

/** Loads a reference list once and exposes id→label lookups and select options. */
export function createLookup<T extends Entity>(
  source: { all(): Observable<readonly T[]> },
  labelOf: (item: T) => string,
): Lookup<T> {
  const all$ = source.all().pipe(
    catchError(() => of([] as readonly T[])),
    shareReplay(1),
  );
  const items = toSignal(
    all$.pipe(
      map((list): ReadonlyMap<string, T> => new Map(list.map((i) => [i.id, i] as [string, T]))),
    ),
    { initialValue: new Map<string, T>() as ReadonlyMap<string, T> },
  );
  return {
    items,
    label: (id) => {
      const item = items().get(id);
      return item ? labelOf(item) : '—';
    },
    options$: all$.pipe(map((list) => list.map((i) => ({ value: i.id, label: labelOf(i) })))),
  };
}
