import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderItemResponse } from '../../models/orderItem.model';

@Injectable({
  providedIn: 'root',
})
export class OrderItemService {
  private http = inject(HttpClient);
  private readonly apiOrderItemUrl = `${environment.apiUrl}/orderitems`;

  /**
   * GET: Mengambil semua order item berdasarkan orderId
   * Endpoint: GET /api/orderitems?orderId={orderId}
   */
  getAllOrderItemsByOrderId(orderId: number): Observable<OrderItemResponse[]> {
    const params = new HttpParams().set('orderId', orderId.toString());
    return this.http.get<OrderItemResponse[]>(this.apiOrderItemUrl, { params });
  }
}