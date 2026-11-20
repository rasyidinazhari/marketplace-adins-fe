import { Injectable } from '@angular/core';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'Buyer' | 'Seller' | string;
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

