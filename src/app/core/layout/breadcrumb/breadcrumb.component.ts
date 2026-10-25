import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

export interface Crumb {
  readonly label: string;
  readonly url: string;
}

/** Builds breadcrumbs from `data.breadcrumb` on the route config (not inherited data). */
function buildCrumbs(route: ActivatedRoute): Crumb[] {
  const crumbs: Crumb[] = [];
  let url = '';
  let current: ActivatedRoute | undefined = route.root.firstChild ?? undefined;
  while (current) {
    // `snapshot` can be briefly undefined while a navigation is being torn down.
    const segment =
      (current.snapshot as ActivatedRoute['snapshot'] | undefined)?.url
        .map((s) => s.path)
        .join('/') ?? '';
    if (segment) url += `/${segment}`;
    const label = current.routeConfig?.data?.['breadcrumb'] as string | undefined;
    if (label) crumbs.push({ label, url });
    current = current.firstChild ?? undefined;
  }
  return crumbs;
}

@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (crumbs().length) {
      <nav aria-label="Breadcrumb">
        <ol>
          @for (c of crumbs(); track c.url; let last = $last) {
            <li>
              @if (last) {
                <span aria-current="page">{{ c.label }}</span>
              } @else {
                <a [routerLink]="c.url">{{ c.label }}</a>
              }
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styles: `
    nav {
      margin-bottom: var(--app-space-3);
      font-size: var(--app-font-size-sm);
    }
    ol {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2);
      list-style: none;
      margin: 0;
      padding: 0;
    }
    li + li::before {
      content: '/';
      margin-right: var(--app-space-2);
      color: var(--app-color-text-muted);
    }
    a {
      color: var(--app-color-primary);
    }
    [aria-current] {
      color: var(--app-color-text-muted);
    }
  `,
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly crumbs = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const crumbs = buildCrumbs(this.route);
        return crumbs.length && crumbs[0].url !== '/dashboard'
          ? [{ label: 'Home', url: '/dashboard' }, ...crumbs]
          : [];
      }),
    ),
    { initialValue: [] as Crumb[] },
  );
}
