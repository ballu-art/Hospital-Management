import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { ROLE_LABELS } from '../../../data-access/models/user';
import { AuthService } from '../../auth/auth.service';
import { AlertsService } from '../../services/alerts.service';
import { HospitalSettingsService } from '../../services/hospital-settings.service';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    RouterLink,
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertsService);
  protected readonly auth = inject(AuthService);
  protected readonly hospital = inject(HospitalSettingsService).settings;
  protected readonly roleLabels = ROLE_LABELS;

  readonly menuExpanded = input(false);
  readonly menuToggle = output<void>();

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected readonly notifications = computed(() => {
    const s = this.alerts.summary();
    return [
      {
        count: s.pendingLeaves,
        text: 'leave requests awaiting approval',
        route: '/staff/leave',
        icon: 'beach_access',
      },
      {
        count: s.lowStock,
        text: 'items at or below reorder level',
        route: '/inventory',
        icon: 'inventory_2',
      },
      {
        count: s.expiringMedicines,
        text: 'medicines expired or expiring soon',
        route: '/pharmacy',
        icon: 'medication',
      },
    ].filter((n) => n.count > 0);
  });
  protected readonly notificationCount = computed(() =>
    this.notifications().reduce((sum, n) => sum + n.count, 0),
  );

  constructor() {
    this.alerts.refresh();
  }

  protected search(): void {
    const term = this.searchControl.value.trim();
    void this.router.navigate(['/patients'], { queryParams: term ? { search: term } : {} });
  }

  protected signOut(): void {
    this.auth.signOut();
    void this.router.navigateByUrl('/login');
  }
}
