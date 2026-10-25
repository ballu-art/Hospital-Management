import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AlertsService } from '../../../core/services/alerts.service';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { TrendChartComponent } from '../../../shared/components/trend-chart/trend-chart.component';
import { toErrorMessage } from '../../../shared/models/app-error';
import { CURRENCY_CODE } from '../../../shared/utils/format';
import { DashboardData, DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    ErrorStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusChipComponent,
    TrendChartComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  private readonly service = inject(DashboardService);
  protected readonly auth = inject(AuthService);
  protected readonly alerts = inject(AlertsService).summary;
  private readonly alertsService = inject(AlertsService);

  protected readonly currency = CURRENCY_CODE;
  protected readonly data = signal<DashboardData | null>(null);
  protected readonly error = signal('');
  protected readonly loading = signal(true);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.alertsService.refresh();
    this.service.load().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.error.set(toErrorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
