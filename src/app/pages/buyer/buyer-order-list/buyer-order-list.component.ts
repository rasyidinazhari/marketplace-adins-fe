import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';

export interface BuyerOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: 'Menunggu Pembayaran' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan';
  store: string;
  productName: string;
  productImage: string;
  itemsCount: number;
  totalPrice: number;
}

@Component({
  selector: 'app-buyer-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNavbarComponent, CompactFooterComponent],
  templateUrl: './buyer-order-list.component.html',
  styleUrl: './buyer-order-list.component.css'
})
export class BuyerOrderListComponent {
  activeTab = 'Semua';
  tabs = ['Semua', 'Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Selesai'];

  orders: BuyerOrder[] = [
    {
      id: '1',
      orderNumber: 'INV/20261119/WA/882194',
      date: '19 Nov 2026, 13:15 WIB',
      status: 'Dikirim',
      store: 'Adins Audio Store',
      productName: 'Wireless Noise-Cancelling Headphones Pro ANC',
      productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      itemsCount: 1,
      totalPrice: 1515000
    },
    {
      id: '2',
      orderNumber: 'INV/20261115/WA/771029',
      date: '15 Nov 2026, 10:20 WIB',
      status: 'Selesai',
      store: 'Kopi Nusantara',
      productName: 'Signature Arabica Coffee Beans Single Origin 250g',
      productImage: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
      itemsCount: 2,
      totalPrice: 185000
    },
    {
      id: '3',
      orderNumber: 'INV/20261110/WA/661902',
      date: '10 Nov 2026, 09:00 WIB',
      status: 'Diproses',
      store: 'Gadget Official',
      productName: 'Smartwatch Ultra 2 Cellular Titanium 49mm',
      productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      itemsCount: 1,
      totalPrice: 3266000
    }
  ];

  get filteredOrders(): BuyerOrder[] {
    if (this.activeTab === 'Semua') {
      return this.orders;
    }
    return this.orders.filter(o => o.status === this.activeTab);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Selesai':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Dikirim':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Diproses':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Menunggu Pembayaran':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  }
}
