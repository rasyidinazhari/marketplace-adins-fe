import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartItemPayload, CartItemResponse } from '../../models/cart.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private http = inject(HttpClient);
  public readonly defaultPlaceholder = 'assets/product-placeholder.svg';

  // Base URL API (pastikan environment.apiUrl mengarah ke https://localhost:7153)
  private readonly apiCartUrl = `${environment.apiUrl}/carts`;

  /**
   * 1. GET: Mengambil semua item di keranjang milik user yang sedang login
   * Endpoint: GET /api/carts
   */
  getCartItems(): Observable<CartItemResponse[]> {
    return this.http.get<CartItemResponse[]>(this.apiCartUrl);
  }

  /**
   * 2. POST: Menambahkan item baru ke keranjang
   * Endpoint: POST /api/carts/items
   */
  addItemToCart(payload: CartItemPayload): Observable<CartItemResponse> {
    // Karena backend Anda memvalidasi user dari Token JWT (bukan dari body),
    // sebenarnya userId di payload tidak terlalu dibutuhkan oleh backend.
    // Tapi kita kirimkan saja sesuai interface yang ada.
    console.log('payload')
    return this.http.post<CartItemResponse>(`${this.apiCartUrl}/items`, payload);
  }

  /**
   * 3. PUT: Mengubah kuantitas/harga item di keranjang
   * Endpoint: PUT /api/carts/items/{cartId}
   */
  updateCartItem(cartId: number, payload: CartItemPayload): Observable<CartItemResponse> {
    return this.http.put<CartItemResponse>(`${this.apiCartUrl}/items/${cartId}`, payload);
  }

  /**
   * 4. DELETE: Menghapus item dari keranjang
   * Endpoint: DELETE /api/carts/items/{cartId}
   */
  removeCartItem(cartId: number): Observable<void> {
    // Karena backend mengembalikan NoContent() (HTTP 204), 
    // kita set tipe return-nya menjadi Observable<void>
    return this.http.delete<void>(`${this.apiCartUrl}/items/${cartId}`);
  }

  private selectedCartItemIds: number[] = [];

  setSelectedCartItemIds(ids: number[]): void {
    this.selectedCartItemIds = [...ids];
    try {
      sessionStorage.setItem('selectedCartItemIds', JSON.stringify(ids));
    } catch {
      // ignore storage error
    }
  }

  getSelectedCartItemIds(): number[] {
    if (this.selectedCartItemIds.length > 0) {
      return this.selectedCartItemIds;
    }
    try {
      const stored = sessionStorage.getItem('selectedCartItemIds');
      if (stored) {
        this.selectedCartItemIds = JSON.parse(stored);
        return this.selectedCartItemIds;
      }
    } catch {
      // ignore storage error
    }
    return [];
  }

  clearSelectedCartItemIds(): void {
    this.selectedCartItemIds = [];
    try {
      sessionStorage.removeItem('selectedCartItemIds');
    } catch {
      // ignore storage error
    }
  }
}