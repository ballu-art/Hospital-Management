import { Observable } from 'rxjs';
import { Entity, ListQuery, Page } from '../../shared/models/entity';

/**
 * Generic data-access contract. Components and services depend on this shape (via
 * injection tokens), never on a concrete mock or HTTP implementation.
 */
export interface Repository<T extends Entity, TCreate = Omit<T, 'id'>> {
  list(query: ListQuery): Observable<Page<T>>;
  /** All records, for lookups and dashboard aggregation. A real API would expose dedicated endpoints. */
  all(): Observable<readonly T[]>;
  get(id: string): Observable<T>;
  create(input: TCreate): Observable<T>;
  update(id: string, changes: Partial<TCreate>): Observable<T>;
  delete(id: string): Observable<void>;
}
