import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { AuthService } from '../services/auth/auth.service';

function currentRole(): 'Buyer' | 'Seller' | null {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const user = auth.getUser();
  if (!token || !user) return null;

  try {
    const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    const claims = jwtDecode<JwtPayload & { userId: string; [roleClaim]: string }>(token);
    const role = user.role;
    if ((role === 'Buyer' || role === 'Seller') && claims[roleClaim] === role
        && claims.userId === String(user.id) && claims.exp && claims.exp > Date.now() / 1000) {
      return role;
    }
  } catch {
    // Sesi lama dapat berisi token demo.
  }
  auth.clearToken();
  return null;
}

export function authGuard(requiredRole: 'Buyer' | 'Seller'): CanActivateFn {
  return () => {
    const role = currentRole();
    const router = inject(Router);

    if (role === requiredRole) return true;
    if (role === null) {
      return router.parseUrl(requiredRole === 'Seller' ? '/seller/login' : '/buyer/login');
    }
    return router.parseUrl('/');
  };
}

export const loggedOutGuard: CanActivateFn = () => {
  return currentRole() === null || inject(Router).parseUrl('/');
};
