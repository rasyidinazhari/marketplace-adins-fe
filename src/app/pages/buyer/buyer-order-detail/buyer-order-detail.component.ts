import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';
import { OrderService } from '../../../services/order/order.service';
import { AddressService } from '../../../services/address/address.service';
import { OrderResponse } from '../../../models/order.model';
import { AddressResponse } from '../../../models/address.model';
import { OrderItemService } from '../../../services/orderItem/order-item.service';
import { OrderItemResponse } from '../../../models/orderItem.model';

export interface TimelineStep {
  title: string;
  time: string;
  done: boolean;
  current: boolean;
}

export interface OrderDetailItem {
  name: string;
  price: number;
  qty: number;
  image: string;
}

export interface OrderDetailView {
  orderNumber: string;
  date: string;
  status: string;
  statusTone: 'pending' | 'active' | 'done' | 'cancelled';
  canComplete: boolean;
  courier: string;
  trackingNumber: string;
  store: string;
  paymentMethod: string;
  paidAt: string;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  items: OrderDetailItem[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  voucherCode: string | null;
  shippingFee: number;
  serviceFee: number;
  total: number;
}

@Component({
  selector: 'app-buyer-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNavbarComponent, CompactFooterComponent],
  templateUrl: './buyer-order-detail.component.html',
  styleUrl: './buyer-order-detail.component.css'
})
export class BuyerOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderSvc = inject(OrderService);
  private orderItemSvc = inject(OrderItemService);
  private addressSvc = inject(AddressService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  private orderRequest?: Subscription;
  private orderItemsRequest?: Subscription;

  private readonly placeholderImage =
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';

  orderId = 0;
  isLoading = false;
  isUpdating = false;
  errorMessage = '';
  actionError = '';
  isCopied = false;

  order: OrderDetailView | null = null;
  timeline: TimelineStep[] = [];

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.orderId = Number(params.get('id'));
        this.order = null;
        this.timeline = [];

        if (!this.orderId) {
          this.errorMessage = 'ID pesanan tidak valid.';
          this.cdr.detectChanges();
          return;
        }
        this.loadOrder();
      });
  }

  loadOrder(showLoader = true): void {
    this.orderRequest?.unsubscribe();
    this.orderItemsRequest?.unsubscribe();

    if (showLoader) this.isLoading = true;
    this.errorMessage = '';

    this.orderRequest = this.orderSvc.getOrderById(this.orderId).subscribe({
      next: (res: OrderResponse) => {
        const raw: any = (res as any)?.data ?? (res as any)?.order ?? res;
        const previousAddress = this.order?.shippingAddress;
        const previousItems = this.order?.items ?? [];

        this.order = this.mapOrder(raw, previousItems);

        if (previousAddress && previousAddress.address !== '-') {
          this.order.shippingAddress = previousAddress;
        }
        this.timeline = this.buildTimeline(raw);
        this.isLoading = false;
        this.cdr.detectChanges();

        // Ambil daftar item pesanan dari OrderItemService
        this.loadOrderItems(this.orderId);

        if (!previousAddress || previousAddress.address === '-') {
          const addressId = this.toNumber(this.pick(raw, 'addressId'));
          if (!isNaN(addressId)) this.loadShippingAddress(addressId);
        }
      },
      error: (err) => {
        console.error('Gagal mengambil detail pesanan', err);
        this.errorMessage = err.error?.message || 'Gagal memuat detail pesanan.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadOrderItems(orderId: number): void {
    this.orderItemsRequest?.unsubscribe();

    this.orderItemsRequest = this.orderItemSvc.getAllOrderItemsByOrderId(orderId).subscribe({
      next: (res: OrderItemResponse[] | { data?: OrderItemResponse[] }) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        if (!this.order) return;

        const mappedItems: OrderDetailItem[] = list.map((item) => ({
          name: item.productName || '-',
          price: this.toNumber(item.priceAtPurchase) || 0,
          qty: Math.max(1, this.toNumber(item.quantity) || 1),
          image: this.placeholderImage
        }));

        this.order.items = mappedItems;

        const itemsSubtotal = mappedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
        if (itemsSubtotal > 0) {
          this.order.subtotal = itemsSubtotal;
          this.order.discountPercent =
            this.order.discount > 0 ? Math.round((this.order.discount / this.order.subtotal) * 100) : 0;
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal mengambil item pesanan', err);
      }
    });
  }

  private loadShippingAddress(addressId: number): void {
    this.addressSvc.getAllAddresses().subscribe({
      next: (addresses: AddressResponse[]) => {
        const a = addresses.find(x => x.id === addressId);
        if (a && this.order) {
          this.order.shippingAddress = {
            name: a.recipientName,
            phone: a.phoneNumber,
            address: a.fullAddress,
            city: a.city,
            postalCode: a.postalCode
          };
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Gagal mengambil alamat pesanan', err)
    });
  }

  completeOrder(): void {
    if (!this.order?.canComplete || this.isUpdating) return;
    if (!confirm('Konfirmasi bahwa pesanan sudah Anda terima?')) return;

    this.isUpdating = true;
    this.actionError = '';

    this.orderSvc.updateOrderStatus(this.orderId, { status: 'DELIVERED' }).subscribe({
      next: () => {
        this.isUpdating = false;
        this.loadOrder(false);
      },
      error: (err) => {
        console.error('Gagal memperbarui status pesanan', err);
        this.actionError = err.error?.message || 'Gagal memperbarui status pesanan. Silakan coba lagi.';
        this.isUpdating = false;
        this.cdr.detectChanges();
      }
    });
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined || value === '') return NaN;
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.') return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  private firstNumber(...values: unknown[]): number {
    for (const v of values) {
      const n = this.toNumber(v);
      if (!isNaN(n)) return n;
    }
    return NaN;
  }

  private firstPositive(...values: unknown[]): number {
    for (const v of values) {
      const n = this.toNumber(v);
      if (!isNaN(n) && n > 0) return n;
    }
    return NaN;
  }

  private norm(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private pick(obj: any, ...names: string[]): unknown {
    if (!obj || typeof obj !== 'object') return undefined;
    const map = new Map<string, unknown>();
    Object.keys(obj).forEach(k => map.set(this.norm(k), obj[k]));
    for (const n of names) {
      const v = map.get(this.norm(n));
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  }

  private mapItems(raw: any): OrderDetailItem[] {
    const list = this.pick(raw, 'items', 'orderItems', 'orderDetails', 'products');
    if (!Array.isArray(list)) return [];

    return list.map((i: any) => {
      const qty = this.firstPositive(
        this.pick(i, 'quantity', 'qty', 'jumlah')
      ) || 1;

      const unit = this.firstPositive(
        this.pick(i, 'price', 'unitPrice', 'productPrice', 'priceAtPurchase', 'hargaSatuan', 'harga')
      );

      const lineTotal = this.firstPositive(
        this.pick(i, 'totalPrice', 'subtotal', 'total', 'subTotal')
      );

      const price = !isNaN(unit)
        ? unit
        : (!isNaN(lineTotal) ? lineTotal / qty : 0);

      return {
        name: (this.pick(i, 'productName', 'name', 'title') as string) ?? '-',
        price,
        qty,
        image: (this.pick(i, 'imageUrl', 'image', 'thumbnail') as string) || this.placeholderImage
      };
    });
  }

  private mapOrder(raw: any, fallbackItems: OrderDetailItem[] = []): OrderDetailView {
    const status = this.pick(raw, 'orderStatus', 'status') as string | number | undefined;
    const level = this.statusLevel(status);

    let items = this.mapItems(raw);
    if (items.length === 0 && fallbackItems.length > 0) {
      items = fallbackItems;
    }

    const itemsTotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);

    const rawBeforeDisc = this.firstNumber(
      this.pick(raw, 'totalBeforeDisc', 'totalBeforeDiscount', 'subtotal', 'totalPrice', 'totalAmount')
    );
    const rawAfterDisc = this.firstNumber(
      this.pick(raw, 'totalAfterDisc', 'totalAfterDiscount', 'finalPrice', 'grandTotal', 'total')
    );
    const rawDiscount = this.firstNumber(
      this.pick(raw, 'discountAmount', 'discountDisc', 'discount', 'discountValue')
    );

    const subtotal = itemsTotal > 0
      ? itemsTotal
      : (!isNaN(rawBeforeDisc) && rawBeforeDisc > 0 ? rawBeforeDisc : 0);

    const discount = !isNaN(rawDiscount) && rawDiscount > 0 ? rawDiscount : 0;

    const total = !isNaN(rawAfterDisc) && rawAfterDisc > 0
      ? rawAfterDisc
      : Math.max(subtotal - discount, 0);

    const shippingFee = this.firstNumber(this.pick(raw, 'shippingFee', 'shippingCost', 'deliveryFee')) || 0;
    const serviceFee = this.firstNumber(this.pick(raw, 'serviceFee', 'adminFee')) || 0;

    return {
      orderNumber: `#${this.pick(raw, 'id', 'orderId') ?? this.orderId}`,
      date: this.formatDate(this.pick(raw, 'createdAt', 'orderDate') as string),
      status: this.statusLabel(status),
      statusTone: this.statusTone(status),
      canComplete: level === 2,
      courier: '-',
      trackingNumber: '-',
      store: (this.pick(raw, 'storeName', 'store') as string) ?? '-',
      paymentMethod: '-',
      paidAt: level >= 1 ? this.formatDate(this.pick(raw, 'updatedAt') as string) : '-',
      shippingAddress: {
        name: (this.pick(raw, 'recipientName') as string) ?? '-',
        phone: '-',
        address: '-',
        city: '',
        postalCode: ''
      },
      items,
      subtotal,
      discount,
      discountPercent: subtotal > 0 && discount > 0 ? Math.round((discount / subtotal) * 100) : 0,
      voucherCode: (this.pick(raw, 'voucherCode') as string) ?? null,
      shippingFee,
      serviceFee,
      total
    };
  }

  private normalizeStatus(status?: string | number): string {
    if (typeof status === 'number') {
      const map: Record<number, string> = {
        0: 'PENDING_PAYMENT',
        1: 'ON_PROCESS',
        2: 'ON_DELIVERY',
        3: 'DELIVERED'
      };
      return map[status] ?? 'PENDING_PAYMENT';
    }
    return (status || 'PENDING_PAYMENT').trim().toUpperCase();
  }

  private statusLevel(status?: string | number): number {
    switch (this.normalizeStatus(status)) {
      case 'ON_PROCESS':
        return 1;
      case 'ON_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      case 'PENDING_PAYMENT':
      default:
        return 0;
    }
  }

  private statusLabel(status?: string | number): string {
    switch (this.statusLevel(status)) {
      case 1:
        return 'Sedang Diproses';
      case 2:
        return 'Sedang Dikirim';
      case 3:
        return 'Selesai';
      case 0:
      default:
        return 'Menunggu Pembayaran';
    }
  }

  private statusTone(status?: string | number): 'pending' | 'active' | 'done' | 'cancelled' {
    const level = this.statusLevel(status);
    if (level === 3) return 'done';
    if (level === 0) return 'pending';
    return 'active';
  }

  private buildTimeline(raw: any): TimelineStep[] {
    const status = this.pick(raw, 'orderStatus', 'status') as string | number | undefined;
    const current = this.statusLevel(status);
    const createdAt = this.pick(raw, 'createdAt', 'orderDate') as string;
    const updatedAt = this.pick(raw, 'updatedAt') as string;

    const steps = [
      { title: 'Menunggu Pembayaran', time: this.formatDate(createdAt) },
      { title: 'Pesanan Diproses', time: '' },
      { title: 'Paket Sedang Dikirim', time: '' },
      { title: 'Pesanan Diterima (Selesai)', time: '' }
    ];

    return steps.map((s, idx) => ({
      title: s.title,
      time: idx === current && idx > 0 ? this.formatDate(updatedAt) : s.time,
      done: idx <= current,
      current: idx === current
    }));
  }

  private formatDate(value?: string): string {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return (
      new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }).format(d) + ' WIB'
    );
  }

  copyTracking(): void {
    const resi = this.order?.trackingNumber;
    if (!resi || resi === '-') return;
    navigator.clipboard.writeText(resi);
    this.isCopied = true;
    setTimeout(() => {
      this.isCopied = false;
      this.cdr.detectChanges();
    }, 2000);
  }
}