import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, Subject, catchError, of, switchMap, timer } from 'rxjs';
import { CategoryItem, SellerProduct } from '../../../models/product.model';
import { ProductService } from '../../../services/product/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productRequests = new Subject<number>();
  private readonly categoryNames = new Map<number, string>();
  private readonly pageSize = 20;
  private readonly searchDebounceMs = 300;

  searchQuery = '';
  selectedCategoryId = 0;
  page = 1;
  products: SellerProduct[] = [];
  categories: CategoryItem[] = [];
  isLoading = false;
  isLoadingCategories = false;
  productLoadFailed = false;
  categoryLoadFailed = false;
  deletingProductId: number | null = null;
  deleteErrorMessage = '';

  ngOnInit(): void {
    this.productRequests.pipe(
      // A new load cancels both the pending delay and the in-flight request.
      switchMap(delayMs => {
        const { searchQuery, page, selectedCategoryId } = this;
        const requestStart$: Observable<unknown> = delayMs > 0 ? timer(delayMs) : of(undefined);

        return requestStart$.pipe(
          switchMap(() => this.productService.getSellerProducts(
            searchQuery,
            page,
            this.pageSize,
            selectedCategoryId,
          )),
          catchError(() => of(null)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(products => {
      const hasValidResponse = Array.isArray(products);
      this.isLoading = false;
      this.productLoadFailed = !hasValidResponse;
      this.products = hasValidResponse ? products : [];
    });

    this.loadCategories();
    this.loadProducts();
  }

  onSearchChange(searchQuery: string): void {
    this.searchQuery = searchQuery;
    this.loadProducts(1, this.searchDebounceMs);
  }

  onCategoryChange(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.loadProducts();
  }

  loadProducts(page = 1, delayMs = 0): void {
    this.page = page;
    this.isLoading = true;
    this.productLoadFailed = false;
    this.deleteErrorMessage = '';
    this.productRequests.next(delayMs);
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryLoadFailed = false;
    this.productService.getCategories().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: categories => {
        this.categories = categories;
        for (const category of categories) {
          this.categoryNames.set(category.id, category.categoryName);
        }
        this.isLoadingCategories = false;
      },
      error: () => {
        this.categoryLoadFailed = true;
        this.isLoadingCategories = false;
      },
    });
  }

  deleteProduct(product: SellerProduct): void {
    if (this.deletingProductId !== null || !confirm(`Hapus "${product.productName || 'produk ini'}" dari toko?`)) {
      return;
    }

    this.deletingProductId = product.id;
    this.deleteErrorMessage = '';
    this.productService.deleteProduct(product.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        const wasOnlyProductOnPage = !this.isLoading
          && this.products.length === 1
          && this.products[0].id === product.id;
        this.products = this.products.filter(row => row.id !== product.id);
        this.deletingProductId = null;
        this.loadProducts(wasOnlyProductOnPage ? Math.max(1, this.page - 1) : this.page);
      },
      error: () => {
        this.deletingProductId = null;
        this.deleteErrorMessage = 'Gagal menghapus produk. Coba lagi atau muat ulang daftar.';
      },
    });
  }

  getCategoryNames(product: SellerProduct): string {
    return product.productCategories
      ?.map(relation => this.categoryNames.get(relation.categoryId))
      .filter(Boolean)
      .join(', ') || '—';
  }

  get hasNextPage(): boolean {
    return this.products.length === this.pageSize;
  }

  get hasFilters(): boolean {
    return this.searchQuery.trim().length > 0 || this.selectedCategoryId !== 0;
  }
}
