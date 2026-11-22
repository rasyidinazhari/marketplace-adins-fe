import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  id?: number;
  productId: number;
  name: string;
  price: number;
  qty: number;
  image: string;
  storeId: number;
  storeName?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent, ModalComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  private cartSvc = inject(CartService);
  private orderSvc = inject(OrderService);
  private addressSvc = inject(AddressService);
  private voucherSvc = inject(VoucherService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  selectedCourier = 'reguler';
  selectedPayment = 'bca_va';
  isProcessing = false;
  isLoadingCart = false;
  isLoadingAddress = false;

  // Voucher State
  availableVouchers: SellerVoucher[] = [];
  isLoadingVouchers = false;
  isVoucherModalOpen = false;
  selectedVoucher: SellerVoucher | null = null;
  currentStoreName = '';
  currentStoreId = 0;

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
        const selectedIds = this.cartSvc.getSelectedCartItemIds();
        const filteredResponse = selectedIds.length > 0
          ? response.filter(item => selectedIds.includes(item.id))
          : response;

        this.orderItems = filteredResponse.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.productName,
          price: item.totalPrice / item.quantity,
          qty: item.quantity,
          image: this.cartSvc.defaultPlaceholder,
          storeId: item.storeId,
          storeName: item.storeName || 'Toko'
        }));

        if (this.orderItems.length > 0) {
          this.currentStoreId = this.orderItems[0].storeId;
          this.currentStoreName = this.orderItems[0].storeName || 'Toko';
          this.loadStoreVouchers(this.currentStoreId);
        }

        this.isLoadingCart = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal mengambil data keranjang', err);
        this.isLoadingCart = false;
      }
    });
  }

  // --- 2. FETCH STORE VOUCHERS ---
  loadStoreVouchers(storeId: number): void {
    this.isLoadingVouchers = true;
    this.voucherSvc.getVouchers(storeId).subscribe({
      next: (vouchers) => {
        // Hanya ambil voucher yang aktif milik toko ini
        this.availableVouchers = (vouchers || []).filter(v => v.isActive);
        // Jika voucher yang sudah dipilih tidak ada lagi di daftar aktif, lepas
        if (this.selectedVoucher && !this.availableVouchers.some(v => v.id === this.selectedVoucher!.id)) {
          this.selectedVoucher = null;
        }
        this.isLoadingVouchers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal mengambil voucher toko', err);
        this.availableVouchers = [];
        this.isLoadingVouchers = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- 3. FETCH ADDRESSES ---
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

  get subtotal(): number {
    return this.orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }

  get currentShippingCost(): number {
    const courier = this.couriers.find(c => c.id === this.selectedCourier);
    return courier ? courier.price : 15000;
  }

  // Perhitungan Diskon Voucher Toko (Maksimal 1 Voucher per Order)
  get voucherDiscount(): number {
    if (!this.selectedVoucher) return 0;
    const rawDiscount = Math.round((this.subtotal * this.selectedVoucher.discountPercentage) / 100);
    return Math.min(rawDiscount, this.selectedVoucher.maxDiscountAmount);
  }

  get grandTotal(): number {
    return Math.max(0, this.subtotal - this.voucherDiscount);
  }

  // --- FUNGSI MODAL & SELEKSI VOUCHER ---
  openVoucherModal(): void {
    this.isVoucherModalOpen = true;
  }

  closeVoucherModal(): void {
    this.isVoucherModalOpen = false;
  }

  isVoucherEligible(voucher: SellerVoucher): boolean {
    return voucher.isActive && this.subtotal >= voucher.minPurchaseAmount;
  }

  applyVoucher(voucher: SellerVoucher): void {
    if (!this.isVoucherEligible(voucher)) return;
    this.selectedVoucher = voucher;
    this.closeVoucherModal();
  }

  removeVoucher(): void {
    this.selectedVoucher = null;
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
      addressId: this.shippingAddress.id,
      voucherId: this.selectedVoucher ? this.selectedVoucher.id : null,
      voucherCode: this.selectedVoucher ? this.selectedVoucher.code : null
    };

    const statusPayload: UpdateOrderStatusPayload = { status: 'ON_PROCESS' };

    this.orderSvc.createOrder(payload).subscribe({
      next: (res) => {
        this.cartSvc.clearSelectedCartItemIds();
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