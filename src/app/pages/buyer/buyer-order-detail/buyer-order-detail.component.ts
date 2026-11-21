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

interface CheckoutSummary {
  items: OrderDetailItem[];
  subtotal: number;
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
  private addressSvc = inject(AddressService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  private orderRequest?: Subscription;

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
    if (showLoader) this.isLoading = true;
    this.errorMessage = '';

    this.orderRequest = this.orderSvc.getOrderById(this.orderId).subscribe({
      next: (res: OrderResponse) => {
        const raw: any = (res as any)?.data ?? (res as any)?.order ?? res;
        const previousAddress = this.order?.shippingAddress;

        this.order = this.mapOrder(raw);

        if (previousAddress && previousAddress.address !== '-') {
          this.order.shippingAddress = previousAddress;
        }
        this.timeline = this.buildTimeline(raw);
        this.isLoading = false;
        this.cdr.detectChanges();

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

    this.orderSvc.updateOrderStatus(this.orderId, { status: 'Completed' }).subscribe({
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
        this.pick(i, 'price', 'unitPrice', 'productPrice', 'hargaSatuan', 'harga')
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

  private mapOrder(raw: any): OrderDetailView {
    const status = this.pick(raw, 'orderStatus', 'status') as string | number | undefined;
    const level = this.statusLevel(status);

    const summary = history.state?.checkoutSummary as CheckoutSummary | undefined;

    let items = this.mapItems(raw);
    if (items.length === 0 && summary?.items?.length) {
      items = summary.items.map(i => ({
        name: i.name,
        price: this.toNumber(i.price) || 0,
        qty: this.firstPositive(i.qty) || 1,
        image: i.image || this.placeholderImage
      }));
    }

    // Ambil langsung field dari API (termasuk totalBeforeDisc & totalAfterDisc)
    const rawBeforeDisc = this.firstNumber(
      this.pick(raw, 'totalBeforeDisc', 'totalBeforeDiscount', 'subtotal', 'totalPrice', 'totalAmount')
    );
    const rawAfterDisc = this.firstNumber(
      this.pick(raw, 'totalAfterDisc', 'totalAfterDiscount', 'finalPrice', 'grandTotal', 'total')
    );
    const rawDiscount = this.firstNumber(
      this.pick(raw, 'discountAmount', 'discountDisc', 'discount', 'discountValue')
    );

    const itemsTotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);

    let subtotal = !isNaN(rawBeforeDisc) && rawBeforeDisc > 0
      ? rawBeforeDisc
      : (itemsTotal > 0 ? itemsTotal : (this.toNumber(summary?.subtotal) || 0));

    let total: number;
    if (!isNaN(rawAfterDisc) && rawAfterDisc > 0) {
      total = rawAfterDisc;
    } else if (!isNaN(rawDiscount) && rawDiscount > 0) {
      total = Math.max(subtotal - rawDiscount, 0);
    } else {
      total = subtotal;
    }

    const discount = !isNaN(rawDiscount) && rawDiscount > 0
      ? rawDiscount
      : (subtotal > total ? subtotal - total : 0);

    // Jika item ada tapi harga per item belum terbaca dari API, hitung dari subtotal
    if (items.length > 0 && itemsTotal === 0 && subtotal > 0) {
      const totalQty = items.reduce((acc, i) => acc + (i.qty || 1), 0);
      if (items.length === 1 && totalQty > 0) {
        items = items.map(i => ({ ...i, price: subtotal / totalQty }));
      }
    }

    const shippingFee = this.firstNumber(this.pick(raw, 'shippingFee', 'shippingCost', 'deliveryFee')) || 0;
    const serviceFee = this.firstNumber(this.pick(raw, 'serviceFee', 'adminFee')) || 0;

    return {
      orderNumber: `#${this.pick(raw, 'id', 'orderId') ?? this.orderId}`,
      date: this.formatDate(this.pick(raw, 'createdAt', 'orderDate') as string),
      status: this.statusLabel(status),
      statusTone: this.statusTone(status),
      canComplete: !this.isCancelled(status) && level === 3,
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

  private normalize(status?: string | number): string {
    if (typeof status === 'number') {
      const map: Record<number, string> = {
        0: 'PENDING',
        1: 'PAID',
        2: 'PROCESSING',
        3: 'SHIPPED',
        4: 'COMPLETED',
        5: 'CANCELLED'
      };
      return map[status] ?? String(status);
    }
    return (status || '').trim().toUpperCase();
  }

  private isCancelled(status?: string | number): boolean {
    const s = this.normalize(status);
    return s === 'CANCELLED' || s === 'CANCELED';
  }

  private statusLevel(status?: string | number): number {
    switch (this.normalize(status)) {
      case 'PAID':
        return 1;
      case 'PROCESSING':
      case 'PROCESSED':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  }

  private statusLabel(status?: string | number): string {
    if (this.isCancelled(status)) return 'Dibatalkan';
    switch (this.statusLevel(status)) {
      case 1: return 'Sudah Dibayar';
      case 2: return 'Sedang Diproses';
      case 3: return 'Sedang Dikirim';
      case 4: return 'Selesai';
      default: return 'Menunggu Pembayaran';
    }
  }

  private statusTone(status?: string | number): 'pending' | 'active' | 'done' | 'cancelled' {
    if (this.isCancelled(status)) return 'cancelled';
    const level = this.statusLevel(status);
    if (level === 4) return 'done';
    if (level === 0) return 'pending';
    return 'active';
  }

  private buildTimeline(raw: any): TimelineStep[] {
    const status = this.pick(raw, 'orderStatus', 'status') as string | number | undefined;
    const current = this.isCancelled(status) ? 0 : this.statusLevel(status);
    const createdAt = this.pick(raw, 'createdAt', 'orderDate') as string;
    const updatedAt = this.pick(raw, 'updatedAt') as string;

    const steps = [
      { title: 'Pesanan Dibuat', time: this.formatDate(createdAt) },
      { title: 'Pembayaran Terverifikasi', time: '' },
      { title: 'Pesanan Diproses Penjual', time: '' },
      { title: 'Paket Sedang Dikirim', time: '' },
      { title: 'Pesanan Selesai', time: '' }
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