import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
  private orderService = inject(OrderService);
  private formBuilder = inject(FormBuilder);

  searchControl = this.formBuilder.nonNullable.control('');
  statuses = sellerOrderStatuses;
  tabs = [{ value: null, label: 'Semua' }, ...sellerOrderStatuses];
  getOrderStatus = getSellerOrderStatus;

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
    this.orderService.getAllOrders().subscribe({
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
    const searchTerm = this.searchControl.value.trim().toLowerCase();
    const selectedStatus = this.selectedStatus;
    if (selectedStatus === null && !searchTerm) return this.orders;

    return this.orders.filter(order => {
      if (selectedStatus !== null && order.orderStatus !== selectedStatus) return false;
      if (!searchTerm) return true;

      const orderNumber = `ord-${order.id}`;
      return orderNumber.includes(searchTerm) || order.userName.toLowerCase().includes(searchTerm);
    });
  }
}
