import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StoreRequest, StoreResponse } from '../../models/store.model';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private http = inject(HttpClient);
  private readonly apiStoreUrl = `${environment.apiUrl}/stores`;

  createStore(data: StoreRequest): Observable<StoreResponse> {
    return this.http.post<StoreResponse>(this.apiStoreUrl, data);
  }

  getStoresBySeller(sellerId: number): Observable<StoreResponse[]> {
    return this.http.get<StoreResponse[]>(`${this.apiStoreUrl}/seller/${sellerId}`);
  }
}