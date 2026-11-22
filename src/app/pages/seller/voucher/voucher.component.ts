import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { ModalComponent } from '../../../components/ui/modal/modal.component';
import { StoreSummary } from '../../../models/product.model';
import { CreateVoucherPayload, SellerVoucher } from '../../../models/voucher.model';
import { ProductService } from '../../../services/product/product.service';
import { SellerStoreScopeService } from '../../../services/store/seller-store-scope.service';
import { VoucherService } from '../../../services/voucher/voucher.service';

@Component({
  selector: 'app-voucher',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, ModalComponent],
  templateUrl: './voucher.component.html',
  styleUrl: './voucher.component.css',
})
export class VoucherComponent implements OnInit {
  private productService = inject(ProductService);
  private voucherService = inject(VoucherService);
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private dashboardStoreControl = inject(SellerStoreScopeService, { optional: true })?.storeControl;
  private voucherRequests = new Subject<number | null>();

  maxVoucherAmount = 2_147_483_647;
  storeControl = this.formBuilder.control<number | null>(null);
  voucherForm = this.formBuilder.group({
    code: this.formBuilder.nonNullable.control(''),
    discountPercentage: this.formBuilder.control<number | null>(null),
    minPurchaseAmount: this.formBuilder.control<number | null>(0),
    maxDiscountAmount: this.formBuilder.control<number | null>(null),
  });

  stores: StoreSummary[] = [];
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
    return this.storeControl.value;
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

    this.storeControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadVouchers());

    this.loadStores();
  }

  loadStores(): void {
    if (this.isLoadingStores) return;

    this.isLoadingStores = true;
    this.storeLoadFailed = false;
    this.productService.getSellerStores().subscribe({
      next: stores => {
        this.stores = stores;
        this.isLoadingStores = false;

        const dashboardStore = stores.find(store => store.id === this.dashboardStoreControl?.value);
        this.storeControl.setValue(dashboardStore?.id ?? (stores.length === 1 ? stores[0].id : null));
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

  openCreateModal(): void {
    if (!this.canManageVouchers || this.isCreateModalOpen) return;

    this.createError = '';
    this.voucherForm.reset({ minPurchaseAmount: 0 });
    this.isCreateModalOpen = true;
  }

  createVoucher(): void {
    const storeId = this.selectedStoreId;
    if (storeId === null || !this.canManageVouchers || !this.isCreateModalOpen) return;

    this.createError = '';
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
    const form = this.voucherForm.getRawValue();
    const code = form.code.trim();
    const { discountPercentage, minPurchaseAmount, maxDiscountAmount } = form;

    if (!code || code.length > 100) {
      return this.invalidForm('Kode voucher wajib diisi dan maksimal 100 karakter.');
    }
    if (!this.isIntegerInRange(discountPercentage, 1, 100)) {
      return this.invalidForm('Diskon harus berupa bilangan bulat dari 1 sampai 100%.');
    }
    if (!this.isIntegerInRange(minPurchaseAmount, 0, this.maxVoucherAmount)) {
      return this.invalidForm('Minimum belanja harus berupa bilangan bulat dari Rp 0 sampai Rp 2.147.483.647.');
    }
    if (!this.isIntegerInRange(maxDiscountAmount, 1, this.maxVoucherAmount)) {
      return this.invalidForm('Maksimum potongan harus berupa bilangan bulat dari Rp 1 sampai Rp 2.147.483.647.');
    }

    return { code, discountPercentage, minPurchaseAmount, maxDiscountAmount };
  }

  private isIntegerInRange(value: number | null, min: number, max: number): value is number {
    return value !== null && Number.isInteger(value) && value >= min && value <= max;
  }

  private invalidForm(message: string): null {
    this.createError = message;
    return null;
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
