import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth/auth.service';

export function authGuard(requiredRole: UserRole): CanActivateFn {
  return () => {
    const role = inject(AuthService).getCurrentRole();
    const router = inject(Router);

    if (role === requiredRole) return true;
    if (role === null) {
      return router.parseUrl(requiredRole === 'Seller' ? '/seller/login' : '/buyer/login');
    }
    return router.parseUrl('/');
  };
}

export const loggedOutGuard: CanActivateFn = () => {
  return inject(AuthService).getCurrentRole() === null || inject(Router).parseUrl('/');
};
