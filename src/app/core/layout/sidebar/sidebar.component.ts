import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { NAV_ITEMS, NavItem } from '../nav.config';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  protected readonly items = computed<readonly NavItem[]>(() =>
    NAV_ITEMS.map((item) =>
      item.children ? { ...item, children: item.children.filter((c) => this.allowed(c)) } : item,
    ).filter((item) => (item.children ? item.children.length > 0 : this.allowed(item))),
  );

  constructor() {
    this.expandActiveGroup();
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.expandActiveGroup());
  }

  protected isExpanded(item: NavItem): boolean {
    return this.expanded().has(item.label);
  }

  protected toggle(item: NavItem): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      if (!next.delete(item.label)) next.add(item.label);
      return next;
    });
  }

  private allowed(item: NavItem): boolean {
    return !item.permission || this.auth.can(item.permission);
  }

  private expandActiveGroup(): void {
    const path = this.router.url.split(/[?#]/)[0];
    const group = NAV_ITEMS.find((i) =>
      i.children?.some((c) => c.route && path.startsWith(c.route)),
    );
    if (group) this.expanded.update((set) => new Set(set).add(group.label));
  }
}
