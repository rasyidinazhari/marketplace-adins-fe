import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../../services/product/product.service';
import { BackendProduct } from '../../../../models/product.model';

export interface ProductItem {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  salesCount: number;
  store: string;
  badge?: string;
  image: string;
}

@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-showcase.component.html',
  styleUrl: './product-showcase.component.css'
})
export class ProductShowcaseComponent implements OnInit {
  private productSvc = inject(ProductService);

  selectedCategory = 'Semua';
  categories: string[] = ['Semua', 'Elektronik', 'Fashion', 'F&B', 'Aksesoris'];
  isLoading = false;

  // Fallback demo data jika backend belum berjalan atau data kosong
  private mockFallbackProducts: ProductItem[] = [
    {
      id: 1,
      name: 'Wireless Noise-Cancelling Headphones Pro',
      category: 'Elektronik',
      price: 1499000,
      originalPrice: 1999000,
      rating: 4.9,
      salesCount: 320,
      store: 'Adins Audio Store',
      badge: 'Diskon 25%',
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 2,
      name: 'Smartwatch Ultra 2 Cellular Titanium 49mm',
      category: 'Elektronik',
      price: 3250000,
      rating: 4.8,
      salesCount: 154,
      store: 'Gadget Official',
      badge: 'Terlaris',
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 3,
      name: 'Minimalist Oxford Cotton Shirt Slim Fit',
      category: 'Fashion',
      price: 249000,
      originalPrice: 350000,
      rating: 4.7,
      salesCount: 88,
      store: 'Urban Style House',
      badge: 'Best Seller',
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 4,
      name: 'Signature Arabica Coffee Beans Single Origin 250g',
      category: 'F&B',
      price: 85000,
      rating: 5.0,
      salesCount: 450,
      store: 'Kopi Nusantara',
      badge: 'Official Store',
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 5,
      name: 'Ergonomic Mechanical Keyboard 75% Wireless',
      category: 'Elektronik',
      price: 890000,
      originalPrice: 1100000,
      rating: 4.9,
      salesCount: 210,
      store: 'Keycraft ID',
      badge: 'Pilihan Editor',
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 6,
      name: 'Classic Leather Bi-Fold Wallet RFID Protection',
      category: 'Aksesoris',
      price: 189000,
      rating: 4.8,
      salesCount: 119,
      store: 'Artisan Leather',
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 7,
      name: 'Canvas Commuter Tote Bag Waterproof',
      category: 'Fashion',
      price: 159000,
      rating: 4.6,
      salesCount: 75,
      store: 'Daily Essentials',
      badge: 'Baru',
      image: this.productSvc.defaultPlaceholder
    },
    {
      id: 8,
      name: 'Insulated Stainless Steel Tumbler 600ml',
      category: 'Aksesoris',
      price: 129000,
      originalPrice: 169000,
      rating: 4.9,
      salesCount: 620,
      store: 'Eco Living',
      badge: 'Diskon 23%',
      image: this.productSvc.defaultPlaceholder
    }
  ];

  products: ProductItem[] = [];

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productSvc.getProducts('', 1, 20).subscribe({
      next: (apiProducts: BackendProduct[]) => {
        this.isLoading = false;
        if (apiProducts && Array.isArray(apiProducts) && apiProducts.length > 0) {
          this.products = apiProducts.map(p => this.mapBackendToProductItem(p));
          this.updateDynamicCategories(this.products);
        } else {
          this.products = [...this.mockFallbackProducts];
          this.updateDynamicCategories(this.products);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Gagal memuat produk dari API /api/products, menggunakan data fallback demo:', err);
        this.products = [...this.mockFallbackProducts];
        this.updateDynamicCategories(this.products);
      }
    });
  }

  private mapBackendToProductItem(p: BackendProduct): ProductItem {
    const categoryName =
      p.categories?.[0]?.categoryName ||
      p.productCategories?.[0]?.category?.categoryName ||
      'Elektronik';

    return {
      id: p.id,
      name: p.productName,
      category: categoryName,
      price: p.productPrice,
      originalPrice: undefined,
      rating: p.rating ?? 0,
      salesCount: p.salesCount ?? 0,
      store: p.store?.storeName || p.storeName || 'Adins Official Store',
      badge: (p.productStock ?? 0) <= 5 ? 'Stok Terbatas' : undefined,
      image: this.productSvc.getProductImage(p)
    };
  }

  private updateDynamicCategories(items: ProductItem[]): void {
    const categorySet = new Set<string>();
    for (const item of items) {
      if (item.category) {
        categorySet.add(item.category);
      }
    }
    this.categories = ['Semua', ...Array.from(categorySet)];
  }

  get filteredProducts(): ProductItem[] {
    if (this.selectedCategory === 'Semua') {
      return this.products;
    }
    return this.products.filter(
      p => p.category.toLowerCase() === this.selectedCategory.toLowerCase()
    );
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }
}
