import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AppUser } from '../../data-access/models/user';
import { USER_REPOSITORY } from '../../data-access/repositories/repository-tokens';
import { AppError } from '../../shared/models/app-error';
import { Permission, ROLE_PERMISSIONS } from './permissions';

/**
 * DEMONSTRATION ONLY. There are no credentials, tokens or refresh logic: the "sign in" screen
 * simply selects a demo user and keeps it in memory (a reload signs you out).
 * Real authentication and authorization must be implemented and enforced by a trusted backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly users = inject(USER_REPOSITORY);
  private readonly current = signal<AppUser | null>(null);

  readonly user = this.current.asReadonly();
  readonly isAuthenticated = computed(() => this.current() !== null);

  demoAccounts(): Observable<readonly AppUser[]> {
    return this.users.all().pipe(map((all) => all.filter((u) => u.status === 'Active')));
  }

  signIn(userId: string): Observable<AppUser> {debugger;
    return this.users.get(userId).pipe(
      tap((user) => {
        if (user.status !== 'Active') {
          throw new AppError('validation', 'This demo account is disabled.');
        }
        this.current.set(user);
      }),
    );
  }

  signOut(): void {
    this.current.set(null);
  }

  /** UI-level permission check. Reads a signal, so templates and computeds stay reactive. */
  can(permission: Permission): boolean {debugger;
    const user = this.current();
    return !!user && ROLE_PERMISSIONS[user.role].includes(permission);
  }
}
