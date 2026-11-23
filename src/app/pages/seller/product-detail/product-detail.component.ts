import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { CategoryItem, SellerProduct, StoreSummary, UpdateProductPayload } from '../../../models/product.model';
import { ProductService } from '../../../services/product/product.service';

interface ProductFormData {
  name: string;
  description: string;
  price: number | null;
  stock: number | null;
  categoryIds: number[];
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private originalForm: ProductFormData | null = null;

  isEditMode = false;
  productId: number | null = null;
  isLoading = false;
  isSaving = false;
  loadError = '';
  errorMessage = '';
  hasConflict = false;
  categories: CategoryItem[] = [];
  store: StoreSummary | null = null;
  storeName = '';
  priceDisplay = '';

  productForm = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control(''),
    description: this.formBuilder.nonNullable.control(''),
    price: this.formBuilder.control<number | null>(null),
    stock: this.formBuilder.control<number | null>(0),
    categoryIds: this.formBuilder.nonNullable.control<number[]>([]),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = id !== null;

    if (id !== null) {
      const productId = Number(id);
      if (!/^\d+$/.test(id) || !Number.isSafeInteger(productId) || productId <= 0) {
        this.loadError = 'ID produk tidak valid.';
        return;
      }
      this.productId = productId;
    }

    this.loadForm();
  }

  loadForm(): void {
    if (this.isLoading || this.isSaving) return;

    this.isLoading = true;
    this.loadError = '';
    this.errorMessage = '';
    this.hasConflict = false;

    const productId = this.productId;
    const categories$ = this.productService.getCategories();
    const stores$ = productId === null ? this.productService.getSellerStores() : of([]);
    const product$ = productId === null ? of(null) : this.productService.getSellerProductById(productId);

    forkJoin({ categories: categories$, stores: stores$, product: product$ }).subscribe({
      next: ({ categories, stores, product }) => {
        this.categories = categories;
        if (product) {
          this.fillEditForm(product);
        } else if (this.isEditMode) {
          this.loadError = 'Produk tidak tersedia.';
        } else {
          this.priceDisplay = '';
          this.store = stores[0] ?? null;
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loadError = error.status === 404 && this.isEditMode
          ? 'Produk tidak ditemukan atau tidak tersedia untuk akun ini.'
          : 'Gagal memuat data formulir produk. Coba lagi.';
        this.isLoading = false;
      },
    });
  }

  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const [integerDigits, decimalDigits] = input.value.replace(/[^\d,]/g, '').split(',', 2);

    if (!integerDigits && decimalDigits === undefined) {
      this.priceDisplay = '';
      input.value = '';
      this.productForm.controls.price.setValue(null);
      return;
    }

    const integerPart = integerDigits || '0';
    const fraction = decimalDigits?.slice(0, 2);
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    this.priceDisplay = fraction === undefined ? formattedInteger : `${formattedInteger},${fraction}`;
    input.value = this.priceDisplay;

    const numericValue = Number(`${integerPart}.${fraction ?? ''}`);
    this.productForm.controls.price.setValue(Number.isFinite(numericValue) ? numericValue : null);
  }

  setCategory(categoryId: number, selected: boolean): void {
    const categoryIds = this.productForm.controls.categoryIds;
    const updatedIds = selected
      ? [...categoryIds.value, categoryId]
      : categoryIds.value.filter(id => id !== categoryId);
    categoryIds.setValue(updatedIds);
  }

  saveProduct(): void {
    if (this.isLoading || this.isSaving || this.loadError || this.hasConflict) return;

    this.errorMessage = '';
    const payload = this.buildProductPayload();
    if (!payload) return;

    const productId = this.productId;
    if (productId !== null) {
      if (Object.keys(payload).length === 0) {
        this.errorMessage = 'Belum ada perubahan untuk disimpan.';
        return;
      }
      this.save(this.productService.updateProduct(productId, payload));
      return;
    }

    this.createProduct(payload);
  }

  private createProduct(payload: UpdateProductPayload): void {
    const { productName, productPrice, productStock, productDescription, categoryIds } = payload;
    if (this.store === null) {
      this.errorMessage = 'Akun ini belum memiliki toko.';
      return;
    }
    if (
      productName === undefined || productPrice === undefined ||
      productStock === undefined || categoryIds === undefined
    ) {
      return;
    }

    this.save(this.productService.createProduct({
      storeId: this.store.id,
      productName,
      productPrice,
      productStock,
      productDescription,
      categoryIds,
    }));
  }

  private fillEditForm(product: SellerProduct): void {
    this.storeName = product.store?.storeName || `Toko #${product.storeId}`;
    const categoryIds = product.productCategories?.map(relation => relation.categoryId) ?? [];
    const priceValue = product.productPrice ?? null;

    this.originalForm = {
      name: product.productName ?? '',
      description: product.productDescription ?? '',
      price: priceValue,
      stock: product.productStock ?? null,
      categoryIds: [...new Set(categoryIds)],
    };
    this.priceDisplay = this.formatRupiahNumber(priceValue);
    this.productForm.reset(this.originalForm);
  }

  private formatRupiahNumber(value: number | null): string {
    if (value === null || !Number.isFinite(value)) return '';
    return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  }

  private save(request: Observable<unknown>): void {
    this.isSaving = true;
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/seller/products']);
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.hasConflict = error.status === 409;
        this.errorMessage = this.getSaveErrorMessage(error);
      },
    });
  }

  private getSaveErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 409:
        return 'Data produk sudah berubah. Muat ulang data produk sebelum menyimpan lagi.';
      case 400: {
        const errors = error.error?.errors as Record<string, string[]> | undefined;
        return error.error?.message || Object.values(errors ?? {}).flat()[0] || 'Periksa kembali data produk.';
      }
      case 404:
        return 'Produk atau toko sudah tidak tersedia untuk akun ini.';
      default:
        return 'Gagal menyimpan produk. Coba lagi.';
    }
  }

  private buildProductPayload(): UpdateProductPayload | null {
    const form = this.productForm.getRawValue();
    const name = form.name.trim();
    const description = form.description.trim();
    const { price, stock, categoryIds } = form;
    const original = this.originalForm;
    const payload: UpdateProductPayload = {};

    // An edit validates only fields being sent so existing values can be left as they are.
    if (!original || name !== original.name.trim()) {
      if (name.length < 5) return this.invalidForm('Nama produk minimal 5 karakter.');
      payload.productName = name;
    }

    if (!original || description !== original.description.trim()) {
      const needsMinimumLength = description.length > 0 || original !== null;
      if (needsMinimumLength && description.length < 25) {
        return this.invalidForm('Deskripsi produk minimal 25 karakter jika diubah atau diisi.');
      }
      if (description) payload.productDescription = description;
    }

    if (!original || price !== original.price) {
      const invalidPrice = price === null || !Number.isFinite(price) || price < 1_000 || price > 9_999_999_999.99;
      if (invalidPrice) {
        return this.invalidForm('Harga produk harus antara Rp 1.000 dan Rp 9.999.999.999,99.');
      }
      payload.productPrice = price;
    }

    if (!original || stock !== original.stock) {
      const invalidStock = stock === null || !Number.isInteger(stock) || stock < 0 || stock > 2_147_483_647;
      if (invalidStock) {
        return this.invalidForm('Stok harus berupa bilangan bulat dari 0 sampai 2.147.483.647.');
      }
      payload.productStock = stock;
      if (original) payload.expectedStock = original.stock;
    }

    const categoriesChanged = !original
      || categoryIds.length !== original.categoryIds.length
      || categoryIds.some(id => !original.categoryIds.includes(id));
    if (categoriesChanged) {
      if (categoryIds.length === 0) return this.invalidForm('Pilih minimal satu kategori.');
      payload.categoryIds = categoryIds;
    }

    return payload;
  }

  private invalidForm(message: string): null {
    this.errorMessage = message;
    return null;
  }
}
