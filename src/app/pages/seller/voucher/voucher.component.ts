import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { ModalComponent } from '../../../components/ui/modal/modal.component';
import { StoreSummary } from '../../../models/product.model';
import { SellerVoucher } from '../../../models/voucher.model';
import { ProductService } from '../../../services/product/product.service';
import { VoucherService } from '../../../services/voucher/voucher.service';

@Component({
  selector: 'app-voucher',
  standalone: true,
  imports: [DecimalPipe, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './voucher.component.html',
  styleUrl: './voucher.component.css',
})
export class VoucherComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly voucherService = inject(VoucherService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly voucherRequests = new Subject<number | null>();

  readonly maxVoucherAmount = 2147483647;
  readonly voucherForm = this.formBuilder.group({
    code: this.formBuilder.nonNullable.control(''),
    discountPercentage: this.formBuilder.control<number | null>(null),
    minPurchaseAmount: this.formBuilder.control<number | null>(0),
    maxDiscountAmount: this.formBuilder.control<number | null>(null),
  });

  stores: StoreSummary[] = [];
  vouchers: SellerVoucher[] = [];
  selectedStoreId: number | null = null;
  isLoadingStores = false;
  isLoadingVouchers = false;
  storeLoadFailed = false;
  voucherLoadFailed = false;
  isCreateModalOpen = false;
  isSaving = false;
  createError = '';
  actionError = '';

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
    this.productService.getSellerStores().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: stores => {
        this.stores = stores;
        this.isLoadingStores = false;
        this.selectStore(stores.length === 1 ? stores[0].id : null);
      },
      error: () => {
        this.isLoadingStores = false;
        this.storeLoadFailed = true;
      },
    });
  }

  selectStore(storeId: number | null): void {
    if (this.isSaving || this.isCreateModalOpen) return;

    this.selectedStoreId = storeId;
    this.loadVouchers();
  }

  loadVouchers(): void {
    if (this.isSaving || this.isCreateModalOpen) return;

    this.isLoadingVouchers = this.selectedStoreId !== null;
    this.voucherLoadFailed = false;
    this.actionError = '';
    this.vouchers = [];
    this.voucherRequests.next(this.selectedStoreId);
  }

  get canManageVouchers(): boolean {
    return this.selectedStoreId !== null && !this.isLoadingVouchers && !this.voucherLoadFailed && !this.isSaving;
  }

  get activeVoucherCount(): number {
    return this.vouchers.filter(voucher => voucher.isActive).length;
  }

  openCreateModal(): void {
    if (!this.canManageVouchers || this.isCreateModalOpen) return;

    this.createError = '';
    this.voucherForm.reset({ minPurchaseAmount: 0 });
    this.isCreateModalOpen = true;
  }

  createVoucher(): void {
    const storeId = this.selectedStoreId;
    if (storeId === null || !this.canManageVouchers || !this.isCreateModalOpen) return;

    const form = this.voucherForm.getRawValue();
    const code = form.code.trim();
    const { discountPercentage, minPurchaseAmount, maxDiscountAmount } = form;
    this.createError = '';

    if (!code || code.length > 100) {
      this.createError = 'Kode voucher wajib diisi dan maksimal 100 karakter.';
      return;
    }
    if (discountPercentage === null || !Number.isInteger(discountPercentage)
      || discountPercentage < 1 || discountPercentage > 100) {
      this.createError = 'Diskon harus berupa bilangan bulat dari 1 sampai 100%.';
      return;
    }
    if (minPurchaseAmount === null || !Number.isInteger(minPurchaseAmount)
      || minPurchaseAmount < 0 || minPurchaseAmount > this.maxVoucherAmount) {
      this.createError = 'Minimum belanja harus berupa bilangan bulat dari Rp 0 sampai Rp 2.147.483.647.';
      return;
    }
    if (maxDiscountAmount === null || !Number.isInteger(maxDiscountAmount)
      || maxDiscountAmount < 1 || maxDiscountAmount > this.maxVoucherAmount) {
      this.createError = 'Maksimum potongan harus berupa bilangan bulat dari Rp 1 sampai Rp 2.147.483.647.';
      return;
    }

    this.isSaving = true;
    this.actionError = '';
    this.voucherService.createVoucher(storeId, {
      code, discountPercentage, minPurchaseAmount, maxDiscountAmount,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    if (!this.canManageVouchers || this.isCreateModalOpen || voucher.storeId !== this.selectedStoreId) return;

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
    if (!this.canManageVouchers || this.isCreateModalOpen || voucher.storeId !== this.selectedStoreId) return;
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

  private getActionError(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 409 && typeof error.error?.message === 'string') return error.error.message;
    if (error.status === 404) return 'Voucher atau toko sudah tidak tersedia. Muat ulang daftar voucher.';

    return fallback;
  }
}
