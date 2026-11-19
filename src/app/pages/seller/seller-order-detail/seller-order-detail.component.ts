import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';

@Component({
  selector: 'app-seller-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent],
  templateUrl: './seller-order-detail.component.html',
  styleUrl: './seller-order-detail.component.css'
})
export class SellerOrderDetailComponent {
  order = {
    orderNumber: 'INV/20261119/WA/882194',
    date: '19 November 2026, 13:15 WIB',
    status: 'Perlu Dikirim',
    courier: 'JNE Reguler (Cashless)',
    shippingCost: 15000,
    buyer: {
      name: 'Budi Santoso',
      phone: '0812-3456-7890',
      email: 'budi.santoso@example.com'
    },
    shippingAddress: {
      address: 'Jl. Jenderal Sudirman Kav. 52-53, SCBD, Gedung Menara Mandiri Lt. 12',
      city: 'Jakarta Selatan',
      postalCode: '12190'
    },
    items: [
      {
        name: 'Wireless Noise-Cancelling Headphones Pro ANC',
        sku: 'AUD-HDP-001',
        price: 1499000,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
      }
    ],
    productTotal: 1499000,
    marketplaceFee: 44970, // 3%
    sellerIncome: 1454030
  };

  trackingNumberInput = '';
  isShipped = false;

  submitTracking(): void {
    if (this.trackingNumberInput.trim()) {
      this.order.status = 'Dalam Pengiriman';
      this.isShipped = true;
    }
  }
}
