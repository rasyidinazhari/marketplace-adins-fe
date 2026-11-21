import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddressPayload, AddressResponse } from '../../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private http = inject(HttpClient);
  
  // Base URL untuk endpoint Address
  private readonly apiUrl = `${environment.apiUrl}/address`;

  /**
   * 1. GET: Mengambil semua alamat milik user yang sedang login
   * Endpoint: GET /api/address
   */
  getAllAddresses(): Observable<AddressResponse[]> {
    return this.http.get<AddressResponse[]>(this.apiUrl);
  }

  /**
   * 2. GET: Mengambil detail satu alamat berdasarkan ID
   * Endpoint: GET /api/address/{id}
   */
  getAddressById(id: number): Observable<AddressResponse> {
    return this.http.get<AddressResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * 3. POST: Menambahkan alamat baru
   * Endpoint: POST /api/address
   */
  createAddress(payload: AddressPayload): Observable<AddressResponse> {
    return this.http.post<AddressResponse>(this.apiUrl, payload);
  }

  /**
   * 4. PUT: Mengubah alamat yang sudah ada
   * Endpoint: PUT /api/address/{id}
   */
  updateAddress(id: number, payload: AddressPayload): Observable<AddressResponse> {
    return this.http.put<AddressResponse>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * 5. DELETE: Menghapus alamat
   * Endpoint: DELETE /api/address/{id}
   */
  deleteAddress(id: number): Observable<void> {
    // Karena backend mengembalikan NoContent (HTTP 204), kita set tipe return menjadi Observable<void>
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}