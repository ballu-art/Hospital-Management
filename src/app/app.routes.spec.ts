import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideInstantMocks } from '../testing/test-providers';
import { AuthService } from './core/auth/auth.service';
import { NAV_ITEMS, NavItem } from './core/layout/nav.config';
import { routes } from './app.routes';

const flat = (items: readonly NavItem[]): NavItem[] =>
  items.flatMap((i) => (i.children ? flat(i.children) : [i]));

describe('route configuration', () => {
  const setup = async (userId?: string) => {
    TestBed.configureTestingModule({
      providers: [...provideInstantMocks(), provideRouter(routes)],
    });
    if (userId)
      await new Promise<void>((r) =>
        TestBed.inject(AuthService)
          .signIn(userId)
          .subscribe(() => r()),
      );
    return RouterTestingHarness.create();
  };

  it('lazy-loads every feature and declares a catch-all not-found route', () => {
    const shell = routes.find((r) => r.path === '')!;
    const children = shell.children ?? [];
    expect(children.find((c) => c.path === '**')?.data?.['code']).toBe('404');
    for (const path of [
      'dashboard',
      'patients',
      'appointments',
      'doctors',
      'departments',
      'admissions',
      'billing',
      'pharmacy',
      'laboratory',
      'radiology',
      'inventory',
      'staff',
      'reports',
      'settings',
    ]) {
      const route = children.find((c) => c.path === path);
      expect(route?.loadChildren, path).toBeDefined();
    }
  });

  it('points every sidebar link at a registered top-level route', () => {
    const tops = new Set((routes.find((r) => r.path === '')!.children ?? []).map((c) => c.path));
    for (const item of flat(NAV_ITEMS)) {
      expect(tops.has(item.route!.split('/')[1]), item.route).toBe(true);
    }
  });

  it('redirects anonymous users to the sign-in page and remembers the target', async () => {
    const harness = await setup();
    await harness.navigateByUrl('/patients');
    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fpatients');
  });

  it('shows the not-found page for unknown URLs when signed in', async () => {
    const harness = await setup('usr-0001');
    await harness.navigateByUrl('/definitely/not/here');
    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
  });

  it('blocks areas the role may not use (UI guard only)', async () => {
    const harness = await setup('usr-0004'); // inventory manager
    await harness.navigateByUrl('/patients');
    expect(TestBed.inject(Router).url).toBe('/forbidden');
    expect(harness.routeNativeElement?.textContent).toContain('Access denied');
  });

  it('lets a permitted role through', async () => {
    const harness = await setup('usr-0001');
    await harness.navigateByUrl('/patients');
    expect(TestBed.inject(Router).url).toBe('/patients');
    expect(harness.routeNativeElement?.textContent).toContain('Patients');
  });
});
