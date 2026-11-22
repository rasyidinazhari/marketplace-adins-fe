import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export type UserRole = 'Buyer' | 'Seller';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  storeName?: string | null;
  stores?: Array<{ id: number; storeName?: string; name?: string }>;
  storeId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setUser(user: AuthUser): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  getCurrentRole(): UserRole | null {
    const token = this.getToken();
    const user = this.getUser();
    if (!token && !user) return null;

    const role = user?.role;
    if (token && (role === 'Buyer' || role === 'Seller')) {
      try {
        const { exp } = jwtDecode(token);
        if (typeof exp === 'number' && Number.isFinite(exp) && exp > Date.now() / 1000) {
          return role;
        }
      } catch {
        // Treat unreadable tokens, including old demo tokens, as guest sessions.
      }
    }

    this.clearToken();
    return null;
  }

  /**
   * Mengambil StoreName untuk seller dari data user yang tersimpan.
   */
  getStoreName(): string | null {
    const user = this.getUser();
    if (!user) return null;

    const directName = user.storeName?.trim();
    if (directName) {
      return directName;
    }

    const firstStore = user.stores?.[0];
    const nestedName = (firstStore?.storeName ?? firstStore?.name)?.trim();
    return nestedName || null;
  }

  /**
   * Mengambil StoreId untuk seller.
   * Sesuai ketentuan: mengambil dari user.Stores.First().Id dengan fallback ke 1.
   */
  getStoreId(): number {
    const user = this.getUser();
    if (user?.stores && user.stores.length > 0) {
      return user.stores[0].id;
    }
    if (user?.storeId) {
      return user.storeId;
    }
    return 1;
  }

  clearToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}