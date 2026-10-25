export interface Entity {
  readonly id: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  readonly active: string;
  readonly direction: SortDirection;
}

/** API-like list query. A future HTTP repository maps this to query-string parameters. */
export interface ListQuery {
  readonly search?: string;
  readonly filters?: Readonly<Record<string, string>>;
  readonly sort?: SortState | null;
  readonly pageIndex: number;
  readonly pageSize: number;
}

/** API-like paged result. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface Option<V extends string = string> {
  readonly value: V;
  readonly label: string;
}
