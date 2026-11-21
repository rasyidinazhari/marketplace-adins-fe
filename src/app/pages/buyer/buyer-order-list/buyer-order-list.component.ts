import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';
import { OrderService } from '../../../services/order/order.service';

export interface BuyerOrder {
  id: number;
  orderNumber: string;
  date: string;
  status: string;
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
export class BuyerOrderListComponent implements OnInit {
  private orderSvc = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);

  private readonly defaultImage =
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';

  activeTab = 'Semua';
  tabs = ['Semua', 'Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Selesai'];

  orders: BuyerOrder[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.orderSvc.getAllOrders().subscribe({
      next: (res: any) => {
        // Kalau dibungkus { data: [...] }, ambil .data; kalau langsung array, pakai res
        const rawList = Array.isArray(res) ? res : (res?.data ?? []);

        this.orders = rawList.map((item: any) => {
          const items = item.items ?? item.orderItems ?? [];
          const firstItem = items[0];

          const itemsCount =
            items.length > 0
              ? items.reduce((total: number, x: any) => total + (x.quantity ?? x.qty ?? 1), 0)
              : 1;

          const totalPrice =
            item.totalAfterDisc ??
            item.totalAfterDiscount ??
            item.totalBeforeDisc ??
            item.totalBeforeDiscount ??
            0;

          return {
            id: item.id,
            orderNumber: `ORD-${item.id}`,
            date: this.formatDate(item.createdAt),
            status: this.mapStatus(item.orderStatus),
            store: item.storeName ?? '-',
            productName: firstItem?.productName ?? firstItem?.name ?? `Pesanan dari ${item.storeName ?? 'Toko'}`,
            productImage: firstItem?.imageUrl ?? firstItem?.image ?? this.defaultImage,
            itemsCount,
            totalPrice
          };
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal ambil daftar pesanan:', err);
        this.errorMessage = 'Gagal memuat daftar pesanan.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredOrders(): BuyerOrder[] {
    if (this.activeTab === 'Semua') return this.orders;
    return this.orders.filter(o => o.status === this.activeTab);
  }

  private mapStatus(status: any): string {
    if (status === 0 || status === 'PENDING_PAYMENT') return 'Menunggu Pembayaran';
    if (status === 1 || status === 'ON_PROCESS') return 'Diproses';
    if (status === 2 || status === 'ON_DELIVERY') return 'Dikirim';
    if (status === 3 || status === 'DELIVERED') return 'Selesai';
    return 'Menunggu Pembayaran';
  }

  getStatusClass(status: string): string {
    if (status === 'Selesai') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Dikirim') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (status === 'Diproses') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-orange-50 text-orange-700 border-orange-200';
  }

  private formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}