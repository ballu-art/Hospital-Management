import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Permission } from './permissions';

/** UX guard only: client-side guards are NOT a security boundary. */
export const authGuard: CanActivateFn = (_route, state) => {debugger;
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const permissionGuard =
  (permission: Permission): CanActivateFn =>
  () => {debugger;
    return inject(AuthService).can(permission) || inject(Router).createUrlTree(['/forbidden']);
  };
