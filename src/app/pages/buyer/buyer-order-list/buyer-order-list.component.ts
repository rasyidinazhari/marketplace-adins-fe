import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';
import { ModalComponent } from '../../../components/ui/modal/modal.component';
import { OrderService } from '../../../services/order/order.service';
import { ReviewService } from '../../../services/review/review.service';
import { OrderItemService } from '../../../services/orderItem/order-item.service';

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
  productId?: number;
}

@Component({
  selector: 'app-buyer-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent, ModalComponent],
  templateUrl: './buyer-order-list.component.html',
  styleUrl: './buyer-order-list.component.css'
})
export class BuyerOrderListComponent implements OnInit {
  private orderSvc = inject(OrderService);
  private reviewSvc = inject(ReviewService);
  private orderItemSvc = inject(OrderItemService);
  private cdr = inject(ChangeDetectorRef);

  private readonly defaultImage =
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';
  private readonly REVIEWED_STORAGE_KEY = 'warungadins_reviewed_orders';

  activeTab = 'Semua';
  tabs = ['Semua', 'Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Selesai'];

  orders: BuyerOrder[] = [];
  isLoading = false;
  errorMessage = '';

  // Set of order IDs that have already been reviewed by the buyer
  reviewedOrderIds = new Set<number>();

  // Review modal state
  isReviewModalOpen = false;
  selectedOrderForReview: BuyerOrder | null = null;
  reviewRating = 5;
  hoveredRating = 0;
  reviewComment = '';
  isSubmittingReview = false;
  reviewError = '';
  reviewSuccessMessage = '';

  ngOnInit(): void {
    this.loadReviewedOrderIds();
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
            totalPrice,
            productId: firstItem?.productId ?? firstItem?.product?.id ?? undefined
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

  // --- Review functionality ---

  private loadReviewedOrderIds(): void {
    try {
      const raw = localStorage.getItem(this.REVIEWED_STORAGE_KEY);
      if (raw) {
        const parsed: number[] = JSON.parse(raw);
        this.reviewedOrderIds = new Set(parsed);
      }
    } catch (e) {
      console.warn('Gagal membaca data ulasan tersimpan dari local storage', e);
    }
  }

  private markOrderAsReviewed(orderId: number): void {
    this.reviewedOrderIds.add(orderId);
    try {
      localStorage.setItem(this.REVIEWED_STORAGE_KEY, JSON.stringify(Array.from(this.reviewedOrderIds)));
    } catch (e) {
      console.warn('Gagal menyimpan status ulasan ke storage', e);
    }
  }

  isOrderReviewed(orderId: number): boolean {
    return this.reviewedOrderIds.has(orderId);
  }

  openReviewModal(order: BuyerOrder): void {
    this.selectedOrderForReview = order;
    this.reviewRating = 5;
    this.hoveredRating = 0;
    this.reviewComment = '';
    this.reviewError = '';
    this.reviewSuccessMessage = '';
    this.isReviewModalOpen = true;

    // Jika productId belum terisi, coba ambil dari OrderItemService
    if (!order.productId) {
      this.orderItemSvc.getAllOrderItemsByOrderId(order.id).subscribe({
        next: (items) => {
          const first = Array.isArray(items) ? items[0] : (items as any)?.data?.[0];
          if (first?.productId) {
            order.productId = first.productId;
          }
        },
        error: (err) => console.warn('Gagal fetch order item product id:', err)
      });
    }
  }

  closeReviewModal(): void {
    this.isReviewModalOpen = false;
    this.selectedOrderForReview = null;
    this.reviewError = '';
    this.reviewSuccessMessage = '';
  }

  setRating(rating: number): void {
    this.reviewRating = rating;
  }

  submitReview(): void {
    if (!this.selectedOrderForReview) return;

    const order = this.selectedOrderForReview;
    const productId = order.productId ?? 1;

    if (this.reviewRating < 1 || this.reviewRating > 5) {
      this.reviewError = 'Pilih rating bintang antara 1 sampai 5.';
      return;
    }

    if (!this.reviewComment.trim()) {
      this.reviewError = 'Mohon tulis ulasan pengalaman belanja Anda.';
      return;
    }

    this.isSubmittingReview = true;
    this.reviewError = '';
    this.reviewSuccessMessage = '';

    this.reviewSvc
      .createReview(productId, {
        rating: this.reviewRating,
        comment: this.reviewComment.trim(),
        orderId: order.id,
      })
      .subscribe({
        next: () => {
          this.isSubmittingReview = false;
          this.reviewSuccessMessage = 'Terima kasih! Ulasan Anda berhasil dikirim.';
          this.markOrderAsReviewed(order.id);
          this.cdr.detectChanges();
          setTimeout(() => {
            this.closeReviewModal();
            this.cdr.detectChanges();
          }, 1500);
        },
        error: (err) => {
          this.isSubmittingReview = false;
          this.reviewError =
            err.error?.message ||
            'Gagal mengirim ulasan. Pastikan pesanan Anda telah selesai (DELIVERED).';
          this.cdr.detectChanges();
        },
      });
  }
}