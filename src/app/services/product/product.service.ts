import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BackendProduct,
  CategoryItem,
  CreateProductPayload,
  SellerProduct,
  StoreSummary,
  UpdateProductPayload,
} from '../../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  public readonly defaultPlaceholder = 'assets/product-placeholder.svg';

  /**
   * Mengambil daftar produk dari API backend
   */
  getProducts(search?: string, page = 1, limit = 20, categoryId = 0): Observable<BackendProduct[]> {
    const params = this.getProductParams(search, page, limit, categoryId);
    return this.http.get<BackendProduct[]>(`${environment.apiUrl}/products`, { params });
  }

  getSellerProducts(search?: string, page = 1, limit = 20, categoryId = 0): Observable<SellerProduct[]> {
    const params = this.getProductParams(search, page, limit, categoryId);
    return this.http.get<SellerProduct[]>(`${environment.apiUrl}/seller/products`, { params });
  }

  private getProductParams(search: string | undefined, page: number, limit: number, categoryId: number): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (categoryId > 0) {
      params = params.set('categoryId', categoryId);
    }

    return params;
  }

  getCategories(): Observable<CategoryItem[]> {
    return this.http.get<CategoryItem[]>(`${environment.apiUrl}/categories`);
  }

  getSellerStores(): Observable<StoreSummary[]> {
    return this.http.get<StoreSummary[]>(`${environment.apiUrl}/seller/stores`);
  }

  /**
   * Mengambil detail 1 produk berdasarkan ID
   */
  getProductById(id: number): Observable<BackendProduct> {
    return this.http.get<BackendProduct>(`${environment.apiUrl}/products/${id}`);
  }

  getSellerProductById(id: number): Observable<SellerProduct> {
    return this.http.get<SellerProduct>(`${environment.apiUrl}/seller/products/${id}`);
  }

  /**
   * Menambahkan produk baru (Memerlukan auth Bearer token)
   */
  createProduct(payload: CreateProductPayload): Observable<BackendProduct> {
    return this.http.post<BackendProduct>(`${environment.apiUrl}/products`, payload);
  }

  /**
   * Memperbarui produk (Memerlukan auth Bearer token)
   */
  updateProduct(productId: number, payload: UpdateProductPayload): Observable<BackendProduct> {
    return this.http.put<BackendProduct>(`${environment.apiUrl}/products/${productId}`, payload);
  }

  /**
   * Menghapus produk (Memerlukan auth Bearer token)
   */
  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/products/${productId}`);
  }

  /**
   * Helper fallback gambar produk: jika imageUrl tidak ada, gunakan asset placeholder default
   */
  getProductImage(product?: { imageUrl?: string; image?: string }): string {
    if (product?.imageUrl && product.imageUrl.trim()) {
      return product.imageUrl;
    }
    if (product?.image && product.image.trim()) {
      return product.image;
    }
    return this.defaultPlaceholder;
  }
}
