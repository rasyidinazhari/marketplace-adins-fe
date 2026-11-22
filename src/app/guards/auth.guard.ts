import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth/auth.service';

const homeByRole: Record<UserRole, string> = {
  Buyer: '/',
  Seller: '/seller/products',
};

export function authGuard(requiredRole: UserRole): CanActivateFn {
  return () => {
    const role = inject(AuthService).getCurrentRole();
    const router = inject(Router);

    if (role === requiredRole) return true;
    if (role === null) {
      return router.parseUrl(requiredRole === 'Seller' ? '/seller/login' : '/buyer/login');
    }
    return router.parseUrl(homeByRole[role]);
  };
}

export const storefrontGuard: CanActivateFn = () => {
  const role = inject(AuthService).getCurrentRole();
  return role !== 'Seller' || inject(Router).parseUrl(homeByRole.Seller);
};

export const loggedOutGuard: CanActivateFn = () => {
  const role = inject(AuthService).getCurrentRole();
  return role === null || inject(Router).parseUrl(homeByRole[role]);
};
