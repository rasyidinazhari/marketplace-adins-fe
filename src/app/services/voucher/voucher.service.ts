import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateVoucherPayload, SellerVoucher } from '../../models/voucher.model';

@Injectable({
  providedIn: 'root',
})
export class VoucherService {
  private readonly http = inject(HttpClient);

  getVouchers(storeId: number): Observable<SellerVoucher[]> {
    return this.http.get<SellerVoucher[]>(this.getVouchersUrl(storeId));
  }

  createVoucher(storeId: number, payload: CreateVoucherPayload): Observable<SellerVoucher> {
    return this.http.post<SellerVoucher>(this.getVouchersUrl(storeId), payload);
  }

  updateVoucherStatus(storeId: number, voucherId: number, isActive: boolean): Observable<SellerVoucher> {
    return this.http.patch<SellerVoucher>(`${this.getVouchersUrl(storeId)}/${voucherId}`, { isActive });
  }

  deleteVoucher(storeId: number, voucherId: number): Observable<void> {
    return this.http.delete<void>(`${this.getVouchersUrl(storeId)}/${voucherId}`);
  }

  private getVouchersUrl(storeId: number): string {
    return `${environment.apiUrl}/stores/${storeId}/vouchers`;
  }
}
