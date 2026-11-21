import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  OrderPayload, 
  OrderResponse, 
  UpdateOrderStatusPayload 
} from '../../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  
  // Base URL untuk endpoint Order
  private readonly apiOrderUrl = `${environment.apiUrl}/orders`;

  /**
   * 1. POST: Membuat Pesanan Baru
   * Endpoint: POST /api/orders
   */
  createOrder(payload: OrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiOrderUrl, payload);
  }

  /**
   * 2. GET: Mengambil Semua Pesanan (Tergantung Role Buyer/Seller dari Token)
   * Endpoint: GET /api/orders
   */
  getAllOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(this.apiOrderUrl);
  }

  /**
   * 3. GET: Mengambil Detail Pesanan Berdasarkan ID
   * Endpoint: GET /api/orders/{orderId}
   */
  getOrderById(orderId: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiOrderUrl}/${orderId}`);
  }

  /**
   * 4. PATCH: Mengubah Status Pesanan
   * Endpoint: PATCH /api/orders/{orderId}
   */
  updateOrderStatus(orderId: number, payload: UpdateOrderStatusPayload): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.apiOrderUrl}/${orderId}`, payload);
  }
}