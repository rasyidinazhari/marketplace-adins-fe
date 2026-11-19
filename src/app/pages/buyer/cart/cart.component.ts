import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';

export interface CartItem {
  id: number;
  name: string;
  category: string;
  store: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  selected: boolean;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  voucherCode = 'WARUNGADINS50';
  discountAmount = 50000;
  isVoucherApplied = true;

  items: CartItem[] = [
    {
      id: 1,
      name: 'Wireless Noise-Cancelling Headphones Pro ANC',
      category: 'Elektronik',
      store: 'Adins Audio Store',
      price: 1499000,
      originalPrice: 1999000,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      selected: true
    },
    {
      id: 2,
      name: 'Signature Arabica Coffee Beans Single Origin 250g',
      category: 'F&B',
      store: 'Kopi Nusantara',
      price: 85000,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
      selected: true
    }
  ];

  get allSelected(): boolean {
    return this.items.length > 0 && this.items.every(i => i.selected);
  }

  toggleSelectAll(): void {
    const nextState = !this.allSelected;
    this.items.forEach(i => i.selected = nextState);
  }

  updateQuantity(item: CartItem, delta: number): void {
    const newQty = item.quantity + delta;
    if (newQty >= 1) {
      item.quantity = newQty;
    }
  }

  removeItem(id: number): void {
    this.items = this.items.filter(i => i.id !== id);
  }

  get selectedItems(): CartItem[] {
    return this.items.filter(i => i.selected);
  }

  get subtotal(): number {
    return this.selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  }

  get finalTotal(): number {
    const total = this.subtotal - (this.isVoucherApplied ? this.discountAmount : 0);
    return Math.max(0, total);
  }

  applyVoucher(): void {
    if (this.voucherCode.trim().toUpperCase() === 'WARUNGADINS50') {
      this.isVoucherApplied = true;
      this.discountAmount = 50000;
    } else {
      this.isVoucherApplied = false;
      this.discountAmount = 0;
    }
  }
}
