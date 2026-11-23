import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { ModalComponent } from '../../../components/ui/modal/modal.component';
import { StoreSummary } from '../../../models/product.model';
import { CreateVoucherPayload, SellerVoucher } from '../../../models/voucher.model';
import { ProductService } from '../../../services/product/product.service';
import { VoucherService } from '../../../services/voucher/voucher.service';

const MAX_VOUCHER_AMOUNT = 2_147_483_647;
const MAX_CODE_LENGTH = 100;

const rupiahFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

type RupiahField = 'minPurchaseAmount' | 'maxDiscountAmount';
type VoucherField = 'code' | 'discountPercentage' | RupiahField;

/** Tidak boleh kosong atau hanya spasi. */
const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

/** Harus bilangan bulat (null dibiarkan, ditangani Validators.required). */
const integerOnly: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  return value === null || value === '' || Number.isInteger(value) ? null : { integer: true };
};

const FIELD_MESSAGES: Record<VoucherField, Record<string, string>> = {
  code: {
    required: 'Kode voucher wajib diisi.',
    maxlength: `Kode voucher maksimal ${MAX_CODE_LENGTH} karakter.`,
  },
  discountPercentage: {
    required: 'Diskon wajib diisi.',
    integer: 'Diskon harus berupa bilangan bulat.',
    min: 'Diskon minimal 1%.',
    max: 'Diskon maksimal 100%.',
  },
  minPurchaseAmount: {
    required: 'Minimum belanja wajib diisi.',
    integer: 'Minimum belanja harus berupa bilangan bulat.',
    min: 'Minimum belanja tidak boleh negatif.',
    max: 'Minimum belanja maksimal Rp 2.147.483.647.',
  },
  maxDiscountAmount: {
    required: 'Maksimum potongan wajib diisi.',
    integer: 'Maksimum potongan harus berupa bilangan bulat.',
    min: 'Maksimum potongan minimal Rp 1.',
    max: 'Maksimum potongan maksimal Rp 2.147.483.647.',
  },
};

@Component({
  selector: 'app-voucher',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './voucher.component.html',
  styleUrl: './voucher.component.css',
})
export class VoucherComponent implements OnInit {
  private productService = inject(ProductService);
  private voucherService = inject(VoucherService);
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private voucherRequests = new Subject<number | null>();

  readonly maxVoucherAmount = MAX_VOUCHER_AMOUNT;
  readonly maxCodeLength = MAX_CODE_LENGTH;

  voucherForm = this.formBuilder.group({
    code: this.formBuilder.nonNullable.control('', [
      Validators.required,
      notBlank,
      Validators.maxLength(MAX_CODE_LENGTH),
    ]),
    discountPercentage: this.formBuilder.control<number | null>(null, [
      Validators.required,
      integerOnly,
      Validators.min(1),
      Validators.max(100),
    ]),
    minPurchaseAmount: this.formBuilder.control<number | null>(0, [
      Validators.required,
      integerOnly,
      Validators.min(0),
      Validators.max(MAX_VOUCHER_AMOUNT),
    ]),
    maxDiscountAmount: this.formBuilder.control<number | null>(null, [
      Validators.required,
      integerOnly,
      Validators.min(1),
      Validators.max(MAX_VOUCHER_AMOUNT),
    ]),
  });

  store: StoreSummary | null = null;
  vouchers: SellerVoucher[] = [];
  isLoadingStores = false;
  isLoadingVouchers = false;
  storeLoadFailed = false;
  voucherLoadFailed = false;
  isCreateModalOpen = false;
  isSaving = false;
  createError = '';
  actionError = '';

  get selectedStoreId(): number | null {
    return this.store?.id ?? null;
  }

  ngOnInit(): void {
    this.voucherRequests.pipe(
      switchMap(storeId => {
        if (storeId === null) return of([]);

        return this.voucherService.getVouchers(storeId).pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(vouchers => {
      const hasValidResponse = Array.isArray(vouchers);
      this.isLoadingVouchers = false;
      this.voucherLoadFailed = !hasValidResponse;
      this.vouchers = hasValidResponse ? vouchers : [];
    });

    this.loadStores();
  }

  loadStores(): void {
    if (this.isLoadingStores) return;

    this.isLoadingStores = true;
    this.storeLoadFailed = false;
    this.productService.getSellerStores().subscribe({
      next: stores => {
        this.store = stores[0] ?? null;
        this.isLoadingStores = false;
        this.loadVouchers();
      },
      error: () => {
        this.isLoadingStores = false;
        this.storeLoadFailed = true;
      },
    });
  }

  loadVouchers(): void {
    if (this.isSaving || this.isCreateModalOpen) return;

    const storeId = this.selectedStoreId;
    this.isLoadingVouchers = storeId !== null;
    this.voucherLoadFailed = false;
    this.actionError = '';
    this.vouchers = [];
    this.voucherRequests.next(storeId);
  }

  get canManageVouchers(): boolean {
    return this.selectedStoreId !== null
      && !this.isLoadingVouchers
      && !this.voucherLoadFailed
      && !this.isSaving;
  }

  get activeVoucherCount(): number {
    return this.vouchers.filter(voucher => voucher.isActive).length;
  }

  // --- FORMAT RUPIAH ---

  /** 1500000 -> "1.500.000". Null -> string kosong. */
  formatRupiah(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : rupiahFormatter.format(value);
  }

  /**
   * Dipanggil setiap user mengetik di kolom rupiah.
   * - Buang semua karakter non-angka
   * - Simpan nilai number murni ke form control (validator ikut jalan)
   * - Tampilkan ulang dengan pemisah ribuan, posisi kursor dijaga
   */
  onRupiahInput(event: Event, field: RupiahField): void {
    const input = event.target as HTMLInputElement;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, '').length;

    let digits = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    while (digits && Number(digits) > MAX_VOUCHER_AMOUNT) {
      digits = digits.slice(0, -1);
    }

    const value = digits ? Number(digits) : null;
    const formatted = this.formatRupiah(value);

    this.voucherForm.controls[field].setValue(value);
    input.value = formatted;

    // Kembalikan kursor ke posisi digit yang sama
    let position = 0;
    let digitCount = 0;
    while (position < formatted.length && digitCount < digitsBeforeCaret) {
      if (/\d/.test(formatted[position])) digitCount++;
      position++;
    }
    input.setSelectionRange(position, position);
  }

  // --- VALIDASI FORM ---

  /** Pesan error untuk satu kolom. String kosong jika valid atau belum disentuh. */
  fieldError(field: VoucherField): string {
    const control = this.voucherForm.controls[field];
    if (!control.invalid || !control.touched) return '';

    const errors = control.errors ?? {};
    const messages = FIELD_MESSAGES[field];
    const key = Object.keys(messages).find(errorKey => errors[errorKey]);
    return key ? messages[key] : 'Nilai tidak valid.';
  }

  markTouched(field: VoucherField): void {
    this.voucherForm.controls[field].markAsTouched();
  }

  // --- AKSI ---

  openCreateModal(): void {
    if (!this.canManageVouchers || this.isCreateModalOpen) return;

    this.createError = '';
    this.voucherForm.reset({
      code: '',
      discountPercentage: null,
      minPurchaseAmount: 0,
      maxDiscountAmount: null,
    });
    this.isCreateModalOpen = true;
  }

  createVoucher(): void {
    const storeId = this.selectedStoreId;
    if (storeId === null || !this.canManageVouchers || !this.isCreateModalOpen) return;

    this.createError = '';
    if (this.voucherForm.invalid) {
      this.voucherForm.markAllAsTouched();
      return;
    }

    const payload = this.buildVoucherPayload();
    if (!payload) return;

    this.isSaving = true;
    this.actionError = '';
    this.voucherService.createVoucher(storeId, payload).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: voucher => {
        this.vouchers = [voucher, ...this.vouchers];
        this.isSaving = false;
        this.isCreateModalOpen = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        const fallback = error.status === 400 ? 'Periksa kembali data voucher.' : 'Gagal membuat voucher. Coba lagi.';
        this.createError = this.getActionError(error, fallback);
      },
    });
  }

  toggleVoucherStatus(voucher: SellerVoucher): void {
    if (!this.canModifyVoucher(voucher)) return;

    this.isSaving = true;
    this.actionError = '';
    this.voucherService.updateVoucherStatus(voucher.storeId, voucher.id, !voucher.isActive).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: updatedVoucher => {
        this.vouchers = this.vouchers.map(row => row.id === updatedVoucher.id ? updatedVoucher : row);
        this.isSaving = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.actionError = this.getActionError(error, 'Gagal mengubah status voucher. Coba lagi.');
      },
    });
  }

  deleteVoucher(voucher: SellerVoucher): void {
    if (!this.canModifyVoucher(voucher)) return;
    if (!confirm(`Hapus voucher "${voucher.code}" dari toko?`)) return;

    this.isSaving = true;
    this.actionError = '';
    this.voucherService.deleteVoucher(voucher.storeId, voucher.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.vouchers = this.vouchers.filter(row => row.id !== voucher.id);
        this.isSaving = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.actionError = this.getActionError(error, 'Gagal menghapus voucher. Coba lagi.');
      },
    });
  }

  private buildVoucherPayload(): CreateVoucherPayload | null {
    const { code, discountPercentage, minPurchaseAmount, maxDiscountAmount } = this.voucherForm.getRawValue();

    // Sudah divalidasi Validators; pengecekan ini hanya untuk narrowing tipe.
    if (discountPercentage === null || minPurchaseAmount === null || maxDiscountAmount === null) {
      return null;
    }

    return { code: code.trim(), discountPercentage, minPurchaseAmount, maxDiscountAmount };
  }

  private canModifyVoucher(voucher: SellerVoucher): boolean {
    return this.canManageVouchers && !this.isCreateModalOpen && voucher.storeId === this.selectedStoreId;
  }

  private getActionError(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 409 && typeof error.error?.message === 'string') return error.error.message;
    if (error.status === 404) return 'Voucher atau toko sudah tidak tersedia. Muat ulang daftar voucher.';

    return fallback;
  }
}
