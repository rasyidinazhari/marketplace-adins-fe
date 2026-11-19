import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';

export interface SellerVoucher {
  id: number;
  code: string;
  name: string;
  discountType: 'Nominal' | 'Persen';
  discountValue: number;
  minSpend: number;
  quota: number;
  used: number;
  validUntil: string;
  status: 'Aktif' | 'Nonaktif' | 'Kadaluarsa';
}

@Component({
  selector: 'app-voucher',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent],
  templateUrl: './voucher.component.html',
  styleUrl: './voucher.component.css'
})
export class VoucherComponent {
  isCreateModalOpen = false;

  vouchers: SellerVoucher[] = [
    {
      id: 1,
      code: 'WARUNGADINS50',
      name: 'Promo Pengguna Baru Rp 50.000',
      discountType: 'Nominal',
      discountValue: 50000,
      minSpend: 200000,
      quota: 500,
      used: 320,
      validUntil: '31 Des 2026',
      status: 'Aktif'
    },
    {
      id: 2,
      code: 'ELEKTRONIK10',
      name: 'Diskon 10% Khusus Gadget & Audio',
      discountType: 'Persen',
      discountValue: 10,
      minSpend: 500000,
      quota: 200,
      used: 145,
      validUntil: '30 Nov 2026',
      status: 'Aktif'
    },
    {
      id: 3,
      code: 'GRATISONGKIR',
      name: 'Potongan Ongkos Kirim Rp 15.000',
      discountType: 'Nominal',
      discountValue: 15000,
      minSpend: 100000,
      quota: 1000,
      used: 890,
      validUntil: '15 Des 2026',
      status: 'Aktif'
    },
    {
      id: 4,
      code: 'FLASHSALE30',
      name: 'Mega Flash Sale Weekend',
      discountType: 'Persen',
      discountValue: 30,
      minSpend: 300000,
      quota: 100,
      used: 100,
      validUntil: '10 Nov 2026',
      status: 'Kadaluarsa'
    }
  ];

  newVoucher = {
    code: '',
    name: '',
    discountType: 'Nominal' as 'Nominal' | 'Persen',
    discountValue: 0,
    minSpend: 0,
    quota: 100,
    validUntil: '31 Des 2026'
  };

  createVoucher(): void {
    if (this.newVoucher.code.trim()) {
      this.vouchers.unshift({
        id: Date.now(),
        code: this.newVoucher.code.toUpperCase(),
        name: this.newVoucher.name || 'Voucher Spesial Toko',
        discountType: this.newVoucher.discountType,
        discountValue: this.newVoucher.discountValue,
        minSpend: this.newVoucher.minSpend,
        quota: this.newVoucher.quota,
        used: 0,
        validUntil: this.newVoucher.validUntil,
        status: 'Aktif'
      });
      this.isCreateModalOpen = false;
      this.newVoucher = {
        code: '',
        name: '',
        discountType: 'Nominal',
        discountValue: 0,
        minSpend: 0,
        quota: 100,
        validUntil: '31 Des 2026'
      };
    }
  }

  toggleVoucherStatus(v: SellerVoucher): void {
    v.status = v.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
  }

  deleteVoucher(id: number): void {
    this.vouchers = this.vouchers.filter(v => v.id !== id);
  }
}
