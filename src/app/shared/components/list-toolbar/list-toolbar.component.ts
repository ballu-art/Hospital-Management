import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface ListFilter {
  readonly key: string;
  readonly label: string;
  readonly options: readonly { value: string; label: string }[];
}

/** Search box and select filters. Extra controls (e.g. date pickers) can be projected. */
@Component({
  selector: 'app-list-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <div class="toolbar" role="search">
      <mat-form-field class="search">
        <mat-label>{{ searchLabel() }}</mat-label>
        <mat-icon matPrefix aria-hidden="true">search</mat-icon>
        <input
          matInput
          type="search"
          autocomplete="off"
          [value]="search()"
          (input)="onSearch($event)"
        />
      </mat-form-field>
      @for (f of filters(); track f.key) {
        <mat-form-field class="filter">
          <mat-label>{{ f.label }}</mat-label>
          <mat-select
            [value]="filterValues()[f.key] ?? ''"
            (selectionChange)="filterChange.emit({ key: f.key, value: $event.value })"
          >
            <mat-option value="">All</mat-option>
            @for (o of f.options; track o.value) {
              <mat-option [value]="o.value">{{ o.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-3);
      align-items: flex-start;
    }
    .search {
      flex: 2 1 260px;
    }
    .filter {
      flex: 1 1 170px;
    }
    :host ::ng-deep mat-form-field {
      width: auto;
    }
    .search,
    .filter {
      min-width: 0;
    }
  `,
})
export class ListToolbarComponent {
  readonly searchLabel = input<string>('Search');
  readonly search = input<string>('');
  readonly filters = input<readonly ListFilter[]>([]);
  readonly filterValues = input<Readonly<Record<string, string>>>({});
  readonly searchChange = output<string>();
  readonly filterChange = output<{ key: string; value: string }>();

  protected onSearch(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}
