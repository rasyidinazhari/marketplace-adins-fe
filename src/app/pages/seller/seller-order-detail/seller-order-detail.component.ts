import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderDetailResponse, OrderStatus } from '../../../models/order.model';
import { OrderService } from '../../../services/order/order.service';
import { getSellerOrderStatus } from '../seller-order-status';

@Component({
  selector: 'app-seller-order-detail',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, RouterLink],
  templateUrl: './seller-order-detail.component.html',
  styleUrl: './seller-order-detail.component.css',
})
export class SellerOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private destroyRef = inject(DestroyRef);
  private activeOrderRequest?: Subscription;

  getOrderStatus = getSellerOrderStatus;

  orderId: number | null = null;
  order: OrderDetailResponse | null = null;
  isLoading = false;
  isUpdating = false;
  loadError = '';
  updateError = '';
  needsReload = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.openOrder(params.get('id'));
    });
  }

  loadOrder(): void {
    const orderId = this.orderId;
    if (orderId === null || this.isLoading || this.isUpdating) return;

    this.isLoading = true;
    this.loadError = '';
    this.updateError = '';
    this.needsReload = false;
    this.order = null;

    this.activeOrderRequest = this.orderService.getOrderById(orderId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: order => {
        this.order = order;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loadError = error.status === 404
          ? 'Pesanan tidak ditemukan atau tidak tersedia untuk akun ini.'
          : 'Gagal memuat detail pesanan.';
        this.isLoading = false;
      },
    });
  }

  get canShip(): boolean {
    return this.order?.orderStatus === OrderStatus.ON_PROCESS;
  }

  markAsShipped(): void {
    const order = this.order;
    if (!order || !this.canShip || this.isUpdating || this.needsReload) return;
    if (!confirm('Tandai pesanan ini sebagai sudah dikirim?')) return;

    this.isUpdating = true;
    this.updateError = '';
    this.activeOrderRequest = this.orderService.updateOrderStatus(order.id, { status: 'ON_DELIVERY' }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: updatedOrder => {
        // Merge the updated order summary into the loaded detail.
        this.order = { ...order, ...updatedOrder };
        this.isUpdating = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isUpdating = false;
        this.needsReload = error.status === 409 || error.status === 404;
        this.updateError = this.needsReload
          ? 'Pesanan sudah berubah. Muat ulang untuk melihat status terbaru.'
          : 'Gagal memperbarui status pesanan. Coba lagi.';
      },
    });
  }

  private openOrder(id: string | null): void {
    this.activeOrderRequest?.unsubscribe();
    this.order = null;
    this.isLoading = false;
    this.isUpdating = false;

    const orderId = Number(id);
    if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(orderId) || orderId <= 0) {
      this.orderId = null;
      this.loadError = 'ID pesanan tidak valid.';
      return;
    }

    this.orderId = orderId;
    this.loadOrder();
  }
}
