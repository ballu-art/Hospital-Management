import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { distinctUntilChanged, filter, map, skip } from 'rxjs';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSidenavModule, RouterOutlet, BreadcrumbComponent, SidebarComponent, TopbarComponent],
  template: `
    <a class="skip-link" href="#main-content" (click)="skipToMain($event)">Skip to main content</a>
    <app-topbar [menuExpanded]="opened()" (menuToggle)="opened.set(!opened())" />
    <p class="demo-banner" role="note">
      Demo environment: all data is fictional and resets on reload. Do not enter real patient data.
    </p>
    <mat-sidenav-container class="container">
      <mat-sidenav
        id="app-sidenav"
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="opened()"
        (openedChange)="opened.set($event)"
      >
        <app-sidebar />
      </mat-sidenav>
      <mat-sidenav-content>
        <main id="main-content" #main tabindex="-1" class="content">
          <app-breadcrumb />
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
    }
    .container {
      flex: 1;
      min-height: 0;
      background: var(--app-color-bg);
    }
    mat-sidenav {
      width: var(--app-sidebar-width);
      max-width: 85vw;
    }
    .content {
      max-width: var(--app-content-max-width);
      margin: 0 auto;
      padding: var(--app-space-5) var(--app-space-4);
      outline: none;
    }
    .demo-banner {
      margin: 0;
      padding: var(--app-space-1) var(--app-space-4);
      background: var(--app-color-warning-soft);
      color: var(--app-color-warning);
      font-size: var(--app-font-size-sm);
      text-align: center;
    }
  `,
})
export class AppShellComponent {
  private readonly router = inject(Router);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  protected readonly isMobile = signal(false);
  protected readonly opened = signal(true);

  constructor() {
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(takeUntilDestroyed())
      .subscribe((state) => {
        this.isMobile.set(state.matches);
        this.opened.set(!state.matches);
      });

    // After each page change (not query-string changes) close the mobile drawer and move
    // focus to the content so keyboard and screen-reader users start at the new page.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects.split(/[?#]/)[0]),
        distinctUntilChanged(),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.isMobile()) this.opened.set(false);
        this.main().nativeElement.focus({ preventScroll: true });
      });
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
