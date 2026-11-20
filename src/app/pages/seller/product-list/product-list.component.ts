import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product/product.service';
import { BackendProduct } from '../../../models/product.model';

export interface SellerProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'Aktif' | 'Draft' | 'Habis';
  salesCount: number;
  image: string;
  selected?: boolean;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  private productSvc = inject(ProductService);

  searchQuery = '';
  selectedCategory = 'Semua';
  isLoading = false;

  categories = ['Semua', 'Elektronik', 'Fashion', 'F&B', 'Aksesoris', 'Umum'];

  // Default fallback produk jika backend offline / kosong
  private mockFallbackProducts: SellerProduct[] = [
    {
      id: 1,
      name: 'Wireless Noise-Cancelling Headphones Pro ANC',
      sku: 'AUD-HDP-001',
      category: 'Elektronik',
      price: 1499000,
      stock: 35,
      status: 'Aktif',
      salesCount: 320,
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 2,
      name: 'Smartwatch Ultra 2 Cellular Titanium 49mm',
      sku: 'GDG-WAT-002',
      category: 'Elektronik',
      price: 3250000,
      stock: 12,
      status: 'Aktif',
      salesCount: 154,
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 3,
      name: 'Minimalist Oxford Cotton Shirt Slim Fit',
      sku: 'FSH-SHT-003',
      category: 'Fashion',
      price: 249000,
      stock: 3,
      status: 'Aktif',
      salesCount: 88,
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 4,
      name: 'Ergonomic Mechanical Keyboard 75% Wireless',
      sku: 'ELC-KEY-004',
      category: 'Elektronik',
      price: 890000,
      stock: 0,
      status: 'Habis',
      salesCount: 210,
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 5,
      name: 'Signature Arabica Coffee Beans Single Origin 250g',
      sku: 'FNB-COF-005',
      category: 'F&B',
      price: 85000,
      stock: 45,
      status: 'Aktif',
      salesCount: 450,
      image: this.productSvc.defaultPlaceholder
    }
  ];

  products: SellerProduct[] = [...this.mockFallbackProducts];

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productSvc.getProducts().subscribe({
      next: (apiProducts: BackendProduct[]) => {
        this.isLoading = false;
        if (apiProducts && Array.isArray(apiProducts) && apiProducts.length > 0) {
          this.products = apiProducts.map(p => this.mapBackendToSellerProduct(p));
        } else {
          // Tetap gunakan fallback jika database backend belum memiliki data
          this.products = [...this.mockFallbackProducts];
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('API error / offline, menggunakan mock data:', err);
        this.products = [...this.mockFallbackProducts];
      }
    });
  }

  private mapBackendToSellerProduct(p: BackendProduct): SellerProduct {
    const categoryName = p.categories?.[0]?.categoryName || 
      p.productCategories?.[0]?.category?.categoryName || 
      'Umum';

    let status: 'Aktif' | 'Draft' | 'Habis' = 'Aktif';
    if (p.productStock === 0) {
      status = 'Habis';
    } else if (p.isActive === false) {
      status = 'Draft';
    }

    return {
      id: p.id,
      name: p.productName,
      sku: `SKU-${p.id.toString().padStart(4, '0')}`,
      category: categoryName,
      price: p.productPrice,
      stock: p.productStock,
      status,
      salesCount: 0,
      image: this.productSvc.getProductImage(p)
    };
  }

  get filteredProducts(): SellerProduct[] {
    return this.products.filter(p => {
      const matchCat = this.selectedCategory === 'Semua' || p.category === this.selectedCategory;
      const matchSearch = !this.searchQuery || 
        p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  get totalProducts(): number {
    return this.products.length;
  }

  get activeProducts(): number {
    return this.products.filter(p => p.status === 'Aktif').length;
  }

  get lowStockProducts(): number {
    return this.products.filter(p => p.stock > 0 && p.stock <= 5).length;
  }

  get totalSales(): number {
    return this.products.reduce((acc, p) => acc + (p.salesCount || 0), 0);
  }

  deleteProduct(id: number): void {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini dari toko?')) {
      this.productSvc.deleteProduct(id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== id);
        },
        error: (err) => {
          console.warn('Delete via API error, updating local state:', err);
          this.products = this.products.filter(p => p.id !== id);
        }
      });
    }
  }

  toggleStatus(product: SellerProduct): void {
    product.status = product.status === 'Aktif' ? 'Draft' : 'Aktif';
  }
}
