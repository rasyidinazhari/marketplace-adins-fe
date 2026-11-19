import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';

export interface SellerOrder {
  id: string;
  orderNumber: string;
  date: string;
  buyerName: string;
  productName: string;
  itemsCount: number;
  totalAmount: number;
  courier: string;
  status: 'Pesanan Baru' | 'Perlu Dikirim' | 'Dalam Pengiriman' | 'Selesai';
}

@Component({
  selector: 'app-seller-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent],
  templateUrl: './seller-order-list.component.html',
  styleUrl: './seller-order-list.component.css'
})
export class SellerOrderListComponent {
  activeTab = 'Semua';
  searchQuery = '';
  tabs = ['Semua', 'Pesanan Baru', 'Perlu Dikirim', 'Dalam Pengiriman', 'Selesai'];

  orders: SellerOrder[] = [
    {
      id: '1',
      orderNumber: 'INV/20261119/WA/882194',
      date: '19 Nov 2026, 13:15 WIB',
      buyerName: 'Budi Santoso',
      productName: 'Wireless Noise-Cancelling Headphones Pro ANC',
      itemsCount: 1,
      totalAmount: 1515000,
      courier: 'JNE Reguler',
      status: 'Perlu Dikirim'
    },
    {
      id: '2',
      orderNumber: 'INV/20261119/WA/882201',
      date: '19 Nov 2026, 11:40 WIB',
      buyerName: 'Ahmad Fauzi',
      productName: 'Signature Arabica Coffee Beans Single Origin 250g',
      itemsCount: 2,
      totalAmount: 170000,
      courier: 'SiCepat Best',
      status: 'Pesanan Baru'
    },
    {
      id: '3',
      orderNumber: 'INV/20261118/WA/771029',
      date: '18 Nov 2026, 16:20 WIB',
      buyerName: 'Siti Rahma',
      productName: 'Smartwatch Ultra 2 Cellular Titanium 49mm',
      itemsCount: 1,
      totalAmount: 3266000,
      courier: 'JNE Express',
      status: 'Dalam Pengiriman'
    },
    {
      id: '4',
      orderNumber: 'INV/20261115/WA/661902',
      date: '15 Nov 2026, 14:00 WIB',
      buyerName: 'Dewi Lestari',
      productName: 'Minimalist Oxford Cotton Shirt Slim Fit',
      itemsCount: 1,
      totalAmount: 264000,
      courier: 'GoSend Instant',
      status: 'Selesai'
    }
  ];

  get filteredOrders(): SellerOrder[] {
    return this.orders.filter(o => {
      const matchTab = this.activeTab === 'Semua' || o.status === this.activeTab;
      const matchSearch = !this.searchQuery || 
        o.orderNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
        o.buyerName.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pesanan Baru':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Perlu Dikirim':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Dalam Pengiriman':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Selesai':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  }
}
