import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';

@Component({
  selector: 'app-buyer-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNavbarComponent, CompactFooterComponent],
  templateUrl: './buyer-order-detail.component.html',
  styleUrl: './buyer-order-detail.component.css'
})
export class BuyerOrderDetailComponent {
  order = {
    orderNumber: 'INV/20261119/WA/882194',
    date: '19 November 2026, 13:15 WIB',
    status: 'Sedang Dikirim',
    courier: 'JNE Reguler',
    trackingNumber: 'JNE881923019230',
    store: 'Adins Audio Store',
    paymentMethod: 'BCA Virtual Account',
    paidAt: '19 November 2026, 13:17 WIB',
    shippingAddress: {
      name: 'Budi Santoso',
      phone: '0812-3456-7890',
      address: 'Jl. Jenderal Sudirman Kav. 52-53, SCBD, Gedung Menara Mandiri Lt. 12',
      city: 'Jakarta Selatan',
      postalCode: '12190'
    },
    items: [
      {
        name: 'Wireless Noise-Cancelling Headphones Pro ANC',
        price: 1499000,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
      }
    ],
    subtotal: 1499000,
    shippingFee: 15000,
    discount: 0,
    serviceFee: 1000,
    total: 1515000
  };

  timeline = [
    { title: 'Pesanan Dibuat', time: '19 Nov 2026, 13:15 WIB', done: true },
    { title: 'Pembayaran Terverifikasi', time: '19 Nov 2026, 13:17 WIB', done: true },
    { title: 'Pesanan Diproses Penjual', time: '19 Nov 2026, 14:00 WIB', done: true },
    { title: 'Paket Sedang Dikirim oleh Kurir JNE', time: '19 Nov 2026, 16:30 WIB', done: true, current: true },
    { title: 'Pesanan Selesai', time: 'Estimasi tiba 21 Nov 2026', done: false }
  ];

  isCopied = false;

  copyTracking(): void {
    navigator.clipboard.writeText(this.order.trackingNumber);
    this.isCopied = true;
    setTimeout(() => this.isCopied = false, 2000);
  }
}
