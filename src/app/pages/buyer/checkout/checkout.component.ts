import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, AbstractControl, Validators } from '@angular/forms';
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

// Aturan validasi alamat
const DIGITS_ONLY = /^\d+$/;
const PHONE_MIN_LENGTH = 9;
const PHONE_MAX_LENGTH = 15;
const POSTAL_CODE_LENGTH = 5;

type AddressField = 'name' | 'phone' | 'city' | 'postalCode' | 'address';
type DigitsField = 'phone' | 'postalCode';

/** Tidak boleh kosong atau hanya spasi. */
const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

const ADDRESS_MESSAGES: Record<AddressField, Record<string, string>> = {
  name: {
    required: 'Nama penerima wajib diisi.',
  },
  phone: {
    required: 'Nomor telepon wajib diisi.',
    pattern: 'Nomor telepon hanya boleh berisi angka.',
    minlength: `Nomor telepon harus ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digit.`,
    maxlength: `Nomor telepon harus ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digit.`,
  },
  city: {},
  postalCode: {
    pattern: 'Kode pos hanya boleh berisi angka.',
    minlength: `Kode pos harus ${POSTAL_CODE_LENGTH} digit.`,
    maxlength: `Kode pos harus ${POSTAL_CODE_LENGTH} digit.`,
  },
  address: {
    required: 'Alamat lengkap wajib diisi.',
  },
};

export interface AddressItem {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface CheckoutItem {
  id: number;
  name: string;
  currentTotalPrice: number | null;
  qty: number;
  image: string;
}

interface CheckoutVoucher extends SellerVoucher {
  discountInCents: number;
  shortfallInCents: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TopNavbarComponent, CompactFooterComponent, ModalComponent],
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
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private currentSubtotalInCents: number | null = null;
  private selectedVoucherId: number | null = null;
  private currentStoreId: number | null = null;

  readonly phoneMaxLength = PHONE_MAX_LENGTH;
  readonly postalCodeLength = POSTAL_CODE_LENGTH;

  currentStoreName = '';
  cartMessage = '';
  availableVouchers: CheckoutVoucher[] = [];
  unavailableVouchers: CheckoutVoucher[] = [];
  isLoadingVouchers = false;
  voucherLoadFailed = false;
  isVoucherModalOpen = false;

  isProcessing = false;
  isLoadingCart = false;
  isLoadingAddress = false;

  // Pilihan kurir & metode pembayaran
  optionsForm = this.fb.nonNullable.group({
    courier: ['reguler'],
    payment: ['bca_va'],
  });

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
  };

  // Form alamat baru
  addressForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, notBlank]],
    phone: ['', [
      Validators.required,
      Validators.pattern(DIGITS_ONLY),
      Validators.minLength(PHONE_MIN_LENGTH),
      Validators.maxLength(PHONE_MAX_LENGTH),
    ]],
    city: [''],
    // Opsional, tetapi jika diisi harus 5 digit angka.
    postalCode: ['', [
      Validators.pattern(DIGITS_ONLY),
      Validators.minLength(POSTAL_CODE_LENGTH),
      Validators.maxLength(POSTAL_CODE_LENGTH),
    ]],
    address: ['', [Validators.required, notBlank]],
  });

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

  get selectedCourier(): string {
    return this.optionsForm.controls.courier.value;
  }

  get selectedPayment(): string {
    return this.optionsForm.controls.payment.value;
  }

  ngOnInit(): void {
    this.loadCartData();
    this.loadAddresses();
  }

  // --- PILIHAN KURIR & PEMBAYARAN ---
  selectCourier(id: string): void {
    if (this.isProcessing) return;
    this.optionsForm.controls.courier.setValue(id);
  }

  selectPayment(id: string): void {
    if (this.isProcessing) return;
    this.optionsForm.controls.payment.setValue(id);
  }

  // --- 1. FETCH CART ---
  loadCartData(): void {
    if (this.isLoadingCart || this.isProcessing) return;

    this.isLoadingCart = true;
    this.cartMessage = '';
    this.orderItems = [];
    this.currentStoreId = null;
    this.currentStoreName = '';
    this.currentSubtotalInCents = null;
    this.selectedVoucherId = null;
    this.availableVouchers = [];
    this.unavailableVouchers = [];
    this.voucherLoadFailed = false;

    this.cartSvc.getCartItems().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: CartItemResponse[]) => {
        this.isLoadingCart = false;
        const items = response ?? [];
        if (items.length === 0) {
          this.cartMessage = 'Keranjang Anda kosong.';
          return;
        }

        const storeParam = this.route.snapshot.queryParamMap.get('storeId');
        if (storeParam === null && new Set(items.map(item => item.storeId)).size > 1) {
          this.cartMessage = 'Pilih satu toko dari keranjang untuk melanjutkan checkout.';
          return;
        }

        const storeId = storeParam === null ? items[0].storeId : Number(storeParam);
        const storeItems = items.filter(item => item.storeId === storeId);
        if (!Number.isSafeInteger(storeId) || storeId <= 0 || storeItems.length === 0) {
          this.cartMessage = 'Tidak ada barang dari toko ini di keranjang.';
          return;
        }

        this.currentStoreId = storeId;
        this.currentStoreName = storeItems[0].storeName;
        this.orderItems = storeItems.map(item => ({
          id: item.id,
          name: item.productName,
          currentTotalPrice: item.currentTotalPrice ?? null,
          qty: item.quantity,
          image: this.cartSvc.defaultPlaceholder,
        }));
        this.prepareVouchers(storeItems);
      },
      error: (err) => {
        console.error('Gagal mengambil data keranjang', err);
        this.cartMessage = 'Gagal memuat data keranjang.';
        this.isLoadingCart = false;
      },
    });
  }

  private prepareVouchers(items: CartItemResponse[]): void {
    let subtotalInCents = 0;
    for (const item of items) {
      const total = item.currentTotalPrice;
      if (total == null || total < 0) return;
      subtotalInCents += Math.round(total * CENTS_PER_RUPIAH);
    }

    this.currentSubtotalInCents = subtotalInCents;
    this.loadVouchers();
  }

  loadVouchers(): void {
    const storeId = this.currentStoreId;
    const subtotalInCents = this.currentSubtotalInCents;
    if (storeId === null || subtotalInCents === null || this.isLoadingVouchers) return;

    this.isLoadingVouchers = true;
    this.voucherLoadFailed = false;
    this.voucherService.getVouchers(storeId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: vouchers => {
        this.setVoucherOptions(vouchers ?? [], subtotalInCents);
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
        ...voucher,
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
        this.savedAddresses = (response ?? []).map(a => ({
          id: a.id,
          name: a.recipientName,
          phone: a.phoneNumber,
          address: a.fullAddress,
          city: a.city,
          postalCode: a.postalCode,
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
    return this.currentSubtotalInCents !== null;
  }

  get canPay(): boolean {
    return this.currentStoreId !== null && this.canChooseVoucher && !this.isLoadingAddress
      && !this.isLoadingVouchers && !this.isProcessing && !this.isVoucherModalOpen;
  }

  get voucherOptions(): CheckoutVoucher[] {
    return [...this.availableVouchers, ...this.unavailableVouchers];
  }

  get selectedVoucher(): CheckoutVoucher | undefined {
    return this.availableVouchers.find(voucher => voucher.id === this.selectedVoucherId);
  }

  applyVoucher(voucher: CheckoutVoucher): void {
    if (voucher.shortfallInCents > 0 || this.isProcessing) return;

    this.selectedVoucherId = voucher.id;
    this.isVoucherModalOpen = false;
  }

  removeVoucher(): void {
    this.selectedVoucherId = null;
  }

  get subtotal(): number {
    return (this.currentSubtotalInCents ?? 0) / CENTS_PER_RUPIAH;
  }

  get currentShippingCost(): number {
    const courier = this.couriers.find(c => c.id === this.selectedCourier);
    return courier ? courier.price : 15000;
  }

  get grandTotal(): number {
    return ((this.currentSubtotalInCents ?? 0) - (this.selectedVoucher?.discountInCents ?? 0)) / CENTS_PER_RUPIAH;
  }

  processPayment(): void {
    const storeId = this.currentStoreId;
    if (storeId === null || !this.canPay) return;

    if (this.shippingAddress.id === 0) {
      alert('Silakan pilih alamat pengiriman terlebih dahulu.');
      this.openAddressModal();
      return;
    }

    this.isProcessing = true;

    const payload: OrderPayload = {
      storeId,
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
        if (err.status === 400 || err.status === 409) this.loadCartData();
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
    this.addressForm.reset();
  }

  switchToSelectAddress(): void {
    this.addressMode = 'select';
  }

  // --- VALIDASI FORM ALAMAT ---

  /** Hapus semua karakter non-angka saat user mengetik / paste. */
  onDigitsInput(event: Event, field: DigitsField): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '');
    if (input.value !== cleaned) {
      input.value = cleaned;
    }
    this.addressForm.controls[field].setValue(cleaned);
  }

  /** Pesan error untuk satu kolom. String kosong jika valid atau belum disentuh. */
  addressError(field: AddressField): string {
    const control = this.addressForm.controls[field];
    if (!control.invalid || !control.touched) return '';

    const errors = control.errors ?? {};
    const messages = ADDRESS_MESSAGES[field];
    const key = Object.keys(messages).find(errorKey => errors[errorKey]);
    return key ? messages[key] : 'Nilai tidak valid.';
  }

  // --- SIMPAN ALAMAT BARU KE API ---
  saveNewAddress(): void {
    if (this.isProcessing) return;

    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const form = this.addressForm.getRawValue();
    const payload: AddressPayload = {
      userId: 1, // Abaikan
      recipientName: form.name.trim(),
      phoneNumber: form.phone,
      city: form.city.trim() || 'Jakarta',
      postalCode: form.postalCode || '10110',
      note: form.address.trim()
    };

    this.isProcessing = true;
    this.addressForm.disable({ emitEvent: false });

    this.addressSvc.createAddress(payload).subscribe({
      next: () => {
        this.isProcessing = false;
        this.addressForm.enable({ emitEvent: false });
        this.isAddressModalOpen = false;
        this.loadAddresses();
        alert('Alamat berhasil ditambahkan!');
      },
      error: (err) => {
        this.isProcessing = false;
        this.addressForm.enable({ emitEvent: false });
        console.error('Gagal menyimpan alamat', err);
        alert('Gagal menyimpan alamat. Pastikan Anda sudah login.');
      }
    });
  }
}