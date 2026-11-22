import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';
import { ModalComponent } from '../../../components/ui/modal/modal.component';
import { CartService } from '../../../services/cart/cart.service';
import { OrderService } from '../../../services/order/order.service';
import { AddressService } from '../../../services/address/address.service';
import { VoucherService } from '../../../services/voucher/voucher.service';
import { CartItemResponse } from '../../../models/cart.model';
import { AddressPayload, AddressResponse } from '../../../models/address.model';
import { OrderPayload, UpdateOrderStatusPayload } from '../../../models/order.model';
import { SellerVoucher } from '../../../models/voucher.model';

const CENTS_PER_RUPIAH = 100;

export interface AddressItem {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  label: string;
  isPrimary?: boolean;
}

export interface CheckoutItem {
  productId: number;
  name: string;
  price: number;
  currentTotalPrice: number | null;
  qty: number;
  image: string;
  storeId: number;
}

interface CheckoutVoucher {
  id: number;
  code: string;
  discountInCents: number;
  shortfallInCents: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, TopNavbarComponent, CompactFooterComponent, ModalComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  private cartSvc = inject(CartService);
  private orderSvc = inject(OrderService);
  private addressSvc = inject(AddressService);
  private voucherService = inject(VoucherService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private voucherSubtotalInCents: number | null = null;

  voucherControl = new FormControl<number | null>(null);
  availableVouchers: CheckoutVoucher[] = [];
  unavailableVouchers: CheckoutVoucher[] = [];
  isLoadingVouchers = false;
  voucherLoadFailed = false;

  selectedCourier = 'reguler';
  selectedPayment = 'bca_va';
  isProcessing = false;
  isLoadingCart = false;
  isLoadingAddress = false;

  // Modal Ubah Alamat State
  isAddressModalOpen = false;
  addressMode: 'select' | 'form' = 'select';
  tempSelectedAddressId = 0;

  // Data Alamat
  savedAddresses: AddressItem[] = [];

  // Alamat default (jika belum pilih)
  shippingAddress: AddressItem = {
    id: 0,
    name: 'Pilih Alamat',
    phone: '-',
    address: 'Silakan pilih alamat pengiriman terlebih dahulu',
    city: '',
    postalCode: '',
    label: '',
  };

  newAddressForm = {
    name: '',
    phone: '',
    label: 'Rumah',
    city: '',
    postalCode: '',
    address: '',
    isPrimary: false
  };

  couriers = [
    { id: 'reguler', name: 'JNE Reguler', eta: '2 - 3 Hari', price: 15000 },
    { id: 'express', name: 'SiCepat Best Express', eta: '1 - 2 Hari', price: 25000 },
    { id: 'instant', name: 'GoSend Instant', eta: '3 Jam Tiba', price: 40000 }
  ];

  paymentMethods = [
    { id: 'bca_va', name: 'BCA Virtual Account', iconType: 'bank', desc: 'Verifikasi instan otomatis 24 jam' },
    { id: 'mandiri_va', name: 'Mandiri Virtual Account', iconType: 'card', desc: 'Transfer melalui Livin by Mandiri atau ATM' },
    { id: 'qris', name: 'QRIS (GoPay, OVO, ShopeePay)', iconType: 'qr', desc: 'Scan barcode melalui aplikasi e-wallet' }
  ];

  orderItems: CheckoutItem[] = [];

  ngOnInit(): void {
    this.loadCartData();
    this.loadAddresses();
  }

  // --- 1. FETCH CART ---
  loadCartData(): void {
    this.isLoadingCart = true;
    this.cartSvc.getCartItems().subscribe({
      next: (response: CartItemResponse[]) => {
        const items = response ?? [];
        this.orderItems = items.map(item => ({
          productId: item.productId,
          name: item.productName,
          price: item.totalPrice / item.quantity,
          currentTotalPrice: item.currentTotalPrice ?? null,
          qty: item.quantity,
          image: this.cartSvc.defaultPlaceholder,
          storeId: item.storeId
        }));
        this.isLoadingCart = false;
        this.prepareVouchers(items);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal mengambil data keranjang', err);
        this.isLoadingCart = false;
      }
    });
  }

  private prepareVouchers(items: CartItemResponse[]): void {
    this.voucherControl.reset();
    this.availableVouchers = [];
    this.unavailableVouchers = [];
    this.voucherSubtotalInCents = null;

    const storeId = items[0]?.storeId;
    if (storeId === undefined) return;

    let subtotalInCents = 0;
    for (const item of items) {
      const total = item.currentTotalPrice;
      if (item.storeId !== storeId || total == null || total < 0) return;
      subtotalInCents += Math.round(total * CENTS_PER_RUPIAH);
    }

    this.voucherSubtotalInCents = subtotalInCents;
    this.loadVouchers();
  }

  loadVouchers(): void {
    const storeId = this.orderItems[0]?.storeId;
    const subtotalInCents = this.voucherSubtotalInCents;
    if (storeId === undefined || subtotalInCents === null || this.isLoadingVouchers) return;

    this.isLoadingVouchers = true;
    this.voucherLoadFailed = false;
    this.voucherService.getVouchers(storeId).subscribe({
      next: vouchers => {
        this.setVoucherOptions(vouchers, subtotalInCents);
        this.isLoadingVouchers = false;
      },
      error: () => {
        this.isLoadingVouchers = false;
        this.voucherLoadFailed = true;
      },
    });
  }

  private setVoucherOptions(vouchers: SellerVoucher[], subtotalInCents: number): void {
    const activeVouchers = vouchers.filter(voucher => voucher.isActive);
    const voucherOptions = activeVouchers.map(voucher => {
      const calculatedDiscountInCents = Math.round(subtotalInCents * voucher.discountPercentage / 100);
      const maxDiscountInCents = voucher.maxDiscountAmount * CENTS_PER_RUPIAH;
      const minPurchaseInCents = voucher.minPurchaseAmount * CENTS_PER_RUPIAH;

      return {
        id: voucher.id,
        code: voucher.code,
        discountInCents: Math.min(calculatedDiscountInCents, maxDiscountInCents),
        shortfallInCents: Math.max(minPurchaseInCents - subtotalInCents, 0),
      };
    });

    this.availableVouchers = voucherOptions.filter(voucher => voucher.shortfallInCents === 0)
      .sort((first, second) => second.discountInCents - first.discountInCents);
    this.unavailableVouchers = voucherOptions.filter(voucher => voucher.shortfallInCents > 0)
      .sort((first, second) => first.shortfallInCents - second.shortfallInCents);
  }

  // --- 2. FETCH ADDRESSES ---
  loadAddresses(): void {
    this.isLoadingAddress = true;
    this.addressSvc.getAllAddresses().subscribe({
      next: (response: AddressResponse[]) => {
        this.savedAddresses = response.map(a => ({
          id: a.id,
          name: a.recipientName,
          phone: a.phoneNumber,
          address: a.fullAddress,
          city: a.city,
          postalCode: a.postalCode,
          label: 'Alamat',
          isPrimary: false
        }));

        if (this.savedAddresses.length > 0) {
          this.shippingAddress = { ...this.savedAddresses[0] };
          this.tempSelectedAddressId = this.savedAddresses[0].id;
        }

        this.isLoadingAddress = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal mengambil alamat', err);
        this.isLoadingAddress = false;
      }
    });
  }

  get canChooseVoucher(): boolean {
    return this.voucherSubtotalInCents !== null;
  }

  get selectedVoucher(): CheckoutVoucher | undefined {
    const voucherId = this.voucherControl.value;
    return voucherId === null ? undefined : this.availableVouchers.find(voucher => voucher.id === voucherId);
  }

  itemSubtotal(item: CheckoutItem): number {
    return this.selectedVoucher && item.currentTotalPrice !== null
      ? item.currentTotalPrice
      : item.price * item.qty;
  }

  get subtotal(): number {
    if (this.selectedVoucher && this.voucherSubtotalInCents !== null) {
      return this.voucherSubtotalInCents / CENTS_PER_RUPIAH;
    }
    return this.orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }

  get currentShippingCost(): number {
    const courier = this.couriers.find(c => c.id === this.selectedCourier);
    return courier ? courier.price : 15000;
  }

  get grandTotal(): number {
    const voucher = this.selectedVoucher;
    if (voucher && this.voucherSubtotalInCents !== null) {
      return (this.voucherSubtotalInCents - voucher.discountInCents) / CENTS_PER_RUPIAH;
    }
    return this.subtotal;
  }

  processPayment(): void {
    if (this.orderItems.length === 0) {
      alert('Keranjang Anda kosong.');
      return;
    }
    if (this.shippingAddress.id === 0) {
      alert('Silakan pilih alamat pengiriman terlebih dahulu.');
      this.openAddressModal();
      return;
    }

    this.isProcessing = true;

    const storeId = this.orderItems[0].storeId;

    const payload: OrderPayload = {
      storeId: storeId,
      addressId: this.shippingAddress.id
    };
    const voucher = this.selectedVoucher;
    if (voucher) payload.voucherId = voucher.id;

    const statusPayload: UpdateOrderStatusPayload = { status: 'ON_PROCESS' };

    this.orderSvc.createOrder(payload).subscribe({
      next: (res) => {
        this.orderSvc.updateOrderStatus(res.id, statusPayload).subscribe({
          next: () => {
            this.isProcessing = false;
            this.router.navigate(['/buyer/orders', res.id]);
          },
          error: (err) => {
            this.isProcessing = false;
            console.error('Gagal memperbarui status pesanan', err);
            this.router.navigate(['/buyer/orders', res.id]);
          }
        });
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('Gagal membuat pesanan', err);
        alert(err.error?.message || 'Gagal memproses pembayaran. Silakan coba lagi.');
      }
    });
  }

  // --- FUNGSI MODAL ALAMAT ---
  openAddressModal(): void {
    this.tempSelectedAddressId = this.shippingAddress.id;
    this.addressMode = 'select';
    this.isAddressModalOpen = true;
  }

  closeAddressModal(): void {
    this.isAddressModalOpen = false;
  }

  selectAddress(id: number): void {
    this.tempSelectedAddressId = id;
  }

  confirmSelectAddress(): void {
    const selected = this.savedAddresses.find(a => a.id === this.tempSelectedAddressId);
    if (selected) {
      this.shippingAddress = { ...selected };
    }
    this.isAddressModalOpen = false;
  }

  switchToNewAddress(): void {
    this.addressMode = 'form';
    this.newAddressForm = {
      name: '', phone: '', label: 'Rumah', city: '', postalCode: '', address: '', isPrimary: false
    };
  }

  switchToSelectAddress(): void {
    this.addressMode = 'select';
  }

  // --- SIMPAN ALAMAT BARU KE API ---
  saveNewAddress(): void {
    if (!this.newAddressForm.name || !this.newAddressForm.phone || !this.newAddressForm.address) {
      alert('Silakan lengkapi nama penerima, nomor telepon, dan alamat lengkap.');
      return;
    }

    const payload: AddressPayload = {
      userId: 1, // Abaikan
      recipientName: this.newAddressForm.name,
      phoneNumber: this.newAddressForm.phone,
      city: this.newAddressForm.city || 'Jakarta',
      postalCode: this.newAddressForm.postalCode || '10110',
      note: this.newAddressForm.address
    };

    this.isProcessing = true;
    this.addressSvc.createAddress(payload).subscribe({
      next: (res) => {
        this.isProcessing = false;
        this.isAddressModalOpen = false;
        this.loadAddresses();
        alert('Alamat berhasil ditambahkan!');
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('Gagal menyimpan alamat', err);
        alert('Gagal menyimpan alamat. Pastikan Anda sudah login.');
      }
    });
  }
}
