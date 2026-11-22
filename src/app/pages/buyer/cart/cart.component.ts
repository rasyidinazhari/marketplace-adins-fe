import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';
import { CartService } from '../../../services/cart/cart.service';
import { CartItemResponse } from '../../../models/cart.model';

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  store: string;
  storeId?: number;
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
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  items: CartItem[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  defaultImage = 'assets/product-placeholder.svg';

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.cartService.getCartItems().subscribe({
      next: (response: CartItemResponse[]) => {
        this.items = response.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.productName,
          store: item.storeName || 'Toko Tidak Diketahui',
          storeId: item.storeId,
          price: item.totalPrice / item.quantity,
          quantity: item.quantity,
          image: this.defaultImage,
          selected: true
        }));

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal mengambil data keranjang', err);
        this.errorMessage = 'Gagal memuat data keranjang. Silakan coba lagi.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- GETTER UNTUK GROUPING TOKO ---
  get groupedItems() {
    const groups: { [key: string]: CartItem[] } = {};

    this.items.forEach(item => {
      if (!groups[item.store]) {
        groups[item.store] = [];
      }
      groups[item.store].push(item);
    });

    return Object.keys(groups).map(storeName => ({
      storeName: storeName,
      items: groups[storeName]
    }));
  }

  isAllStoreSelected(storeItems: CartItem[]): boolean {
    return storeItems.every(i => i.selected);
  }

  toggleStoreSelection(storeItems: CartItem[]): void {
    const nextState = !this.isAllStoreSelected(storeItems);
    storeItems.forEach(i => i.selected = nextState);
  }

  // --- GETTER UNTUK SELEKSI GLOBAL ---
  get allSelected(): boolean {
    return this.items.length > 0 && this.items.every(i => i.selected);
  }

  toggleSelectAll(): void {
    const nextState = !this.allSelected;
    this.items.forEach(i => i.selected = nextState);
  }

  // --- CRUD ACTIONS ---
  updateQuantity(item: CartItem, delta: number): void {
    const newQty = item.quantity + delta;
    if (newQty >= 1) {
      const oldQty = item.quantity;
      item.quantity = newQty;

      const newTotalPrice = item.price * newQty;

      const payload = {
        userId: 1,
        productId: item.productId,
        quantity: newQty,
        totalPrice: newTotalPrice
      };

      this.cartService.updateCartItem(item.id, payload).subscribe({
        next: () => {},
        error: (err) => {
          console.error('Gagal update kuantitas', err);
          item.quantity = oldQty;
        }
      });
    }
  }

  removeItem(id: number): void {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      this.cartService.removeCartItem(id).subscribe({
        next: () => {
          this.items = this.items.filter(i => i.id !== id);
        },
        error: (err) => {
          console.error('Gagal menghapus item', err);
          alert('Gagal menghapus item dari keranjang.');
        }
      });
    }
  }

  removeAllItems(): void {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA item dari keranjang?')) {
      this.items.forEach(item => {
        this.cartService.removeCartItem(item.id).subscribe();
      });
      this.items = [];
    }
  }

  // --- PERHITUNGAN HARGA ---
  get selectedItems(): CartItem[] {
    return this.items.filter(i => i.selected);
  }

  get subtotal(): number {
    return this.selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  }

  get finalTotal(): number {
    return Math.max(0, this.subtotal);
  }

  proceedToCheckout(): void {
    if (this.selectedItems.length === 0) return;

    // Validasi toko: pesanan diproses per toko
    const uniqueStoreIds = Array.from(new Set(this.selectedItems.map(i => i.storeId).filter(Boolean)));
    if (uniqueStoreIds.length > 1) {
      alert('Untuk saat ini, proses checkout hanya dapat memproses produk dari 1 toko dalam satu transaksi. Silakan centang produk dari satu toko saja.');
      return;
    }

    this.cartService.setSelectedCartItemIds(this.selectedItems.map(i => i.id));
    this.router.navigate(['/checkout']);
  }
}