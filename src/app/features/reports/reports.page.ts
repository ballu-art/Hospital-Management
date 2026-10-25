import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { toErrorMessage } from '../../shared/models/app-error';
import { Report, ReportsService, toCsv } from './reports.service';

@Component({
  selector: 'app-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header title="Reports & analytics" subtitle="Tabular reports built from demo data">
      @if (current()) {
        <button mat-stroked-button type="button" (click)="download()">
          <mat-icon aria-hidden="true">download</mat-icon>
          Export CSV
        </button>
      }
    </app-page-header>
    @if (error()) {
      <app-error-state [message]="error()" [retryable]="true" (retry)="load()" />
    } @else if (loading()) {
      <app-loading-state message="Preparing reports…" />
    } @else if (reports().length === 0) {
      <app-empty-state
        icon="analytics"
        title="No reports available"
        message="Your role does not have access to any reports."
      />
    } @else {
      <section class="app-card">
        <mat-form-field class="picker">
          <mat-label>Report</mat-label>
          <mat-select [value]="selectedId()" (selectionChange)="selectedId.set($event.value)">
            @for (r of reports(); track r.id) {
              <mat-option [value]="r.id">{{ r.title }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (current(); as r) {
          <p class="text-muted">{{ r.description }}</p>
          @if (r.rows.length === 0) {
            <app-empty-state
              icon="fact_check"
              title="Nothing to report"
              message="No records match this report."
            />
          } @else {
            <div class="table-scroll">
              <table>
                <caption class="visually-hidden">
                  {{
                    r.title
                  }}
                </caption>
                <thead>
                  <tr>
                    @for (c of r.columns; track c) {
                      <th scope="col">{{ c }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of r.rows; track $index) {
                    <tr>
                      @for (cell of row; track $index) {
                        <td>{{ cell }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </section>
    }
  `,
  styles: `
    .picker {
      max-width: 420px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      padding: var(--app-space-2) var(--app-space-3);
      border-bottom: 1px solid var(--app-color-border);
      text-align: start;
    }
    thead th {
      color: var(--app-color-text-muted);
      font-weight: 500;
    }
  `,
})
export class ReportsPage {
  private readonly service = inject(ReportsService);

  protected readonly reports = signal<readonly Report[]>([]);
  protected readonly selectedId = signal('');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly current = computed(
    () => this.reports().find((r) => r.id === this.selectedId()) ?? null,
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.load().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        if (!reports.some((r) => r.id === this.selectedId()))
          this.selectedId.set(reports[0]?.id ?? '');
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.error.set(toErrorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected download(): void {
    const report = this.current();
    if (!report) return;
    const url = URL.createObjectURL(new Blob([toCsv(report)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
