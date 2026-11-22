import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderResponse, OrderStatus } from '../../../models/order.model';
import { OrderService } from '../../../services/order/order.service';
import { getSellerOrderStatus, sellerOrderStatuses } from '../seller-order-status';

@Component({
  selector: 'app-seller-order-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, ReactiveFormsModule, RouterLink],
  templateUrl: './seller-order-list.component.html',
  styleUrl: './seller-order-list.component.css',
})
export class SellerOrderListComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);

  readonly searchControl = this.formBuilder.nonNullable.control('');
  readonly statuses = sellerOrderStatuses;
  readonly tabs = [{ value: null, label: 'Semua' }, ...sellerOrderStatuses];
  readonly getOrderStatus = getSellerOrderStatus;

  selectedStatus: OrderStatus | null = null;
  orders: OrderResponse[] = [];
  isLoading = false;
  loadError = '';

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.loadError = '';
    this.orderService.getAllOrders().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: orders => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Gagal memuat pesanan toko.';
        this.isLoading = false;
      },
    });
  }

  get orderCounts(): Partial<Record<OrderStatus, number>> {
    const counts: Partial<Record<OrderStatus, number>> = {};
    for (const order of this.orders) {
      counts[order.orderStatus] = (counts[order.orderStatus] ?? 0) + 1;
    }
    return counts;
  }

  get filteredOrders(): OrderResponse[] {
    const search = this.searchControl.value.trim().toLowerCase();
    return this.orders.filter(order => {
      const matchesStatus = this.selectedStatus === null || order.orderStatus === this.selectedStatus;
      const matchesSearch = `ord-${order.id}`.includes(search) || order.userName.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }
}
