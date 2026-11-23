import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../services/product/product.service';
import { BackendProduct } from '../../../../models/product.model';
import { CartService } from '../../../../services/cart/cart.service';
import { AuthService } from '../../../../services/auth/auth.service';

export interface CatalogProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  salesCount: number;
  store: string;
  city: string;
  badge?: string;
  image: string;
}

@Component({
  selector: 'app-product-container',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-container.component.html',
  styleUrl: './product-container.component.css',
})
export class ProductContainerComponent implements OnInit {
  private productSvc = inject(ProductService);
  private cartSvc = inject(CartService);
  private router = inject(Router);
  private authSvc = inject(AuthService);

  searchQuery = '';
  selectedCategory = 'Semua';
  selectedSort = 'popular';
  selectedRating = 0;
  isLoading = false;
  apiErrorMessage = '';
  hasApiConnected = false;

  categories = [
    'Semua',
    'Elektronik',
    'Fashion',
    'F&B',
    'Aksesoris',
    'Perlengkapan Rumah',
  ];

  // Mock data (Jika API gagal, data ini yang ditampilkan)
  private mockFallbackProducts: CatalogProduct[] = [
    {
      id: 1,
      name: 'Wireless Noise-Cancelling Headphones Pro ANC',
      category: 'Elektronik',
      price: 1499000,
      originalPrice: 1999000,
      rating: 4.9,
      salesCount: 320,
      store: 'Adins Audio Store',
      city: 'Jakarta Selatan',
      badge: 'Diskon 25%',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 2,
      name: 'Smartwatch Ultra 2 Cellular Titanium 49mm',
      category: 'Elektronik',
      price: 3250000,
      rating: 4.8,
      salesCount: 154,
      store: 'Gadget Official',
      city: 'Bandung',
      badge: 'Terlaris',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 3,
      name: 'Minimalist Oxford Cotton Shirt Slim Fit Black',
      category: 'Fashion',
      price: 249000,
      originalPrice: 350000,
      rating: 4.7,
      salesCount: 88,
      store: 'Urban Style House',
      city: 'Jakarta Barat',
      badge: 'Best Seller',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 4,
      name: 'Signature Arabica Coffee Beans Single Origin 250g',
      category: 'F&B',
      price: 85000,
      rating: 5.0,
      salesCount: 450,
      store: 'Kopi Nusantara',
      city: 'Medan',
      badge: 'Official',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 5,
      name: 'Ergonomic Mechanical Keyboard 75% Wireless RGB',
      category: 'Elektronik',
      price: 890000,
      originalPrice: 1100000,
      rating: 4.9,
      salesCount: 210,
      store: 'Keycraft ID',
      city: 'Surabaya',
      badge: 'Pilihan Editor',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 6,
      name: 'Classic Leather Bi-Fold Wallet RFID Protection',
      category: 'Aksesoris',
      price: 189000,
      rating: 4.8,
      salesCount: 119,
      store: 'Artisan Leather',
      city: 'Yogyakarta',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 7,
      name: 'Canvas Commuter Tote Bag Waterproof Laptop Sleeve',
      category: 'Fashion',
      price: 159000,
      rating: 4.6,
      salesCount: 75,
      store: 'Daily Essentials',
      city: 'Tangerang',
      badge: 'Baru',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 8,
      name: 'Insulated Stainless Steel Tumbler 600ml Matte Finish',
      category: 'Aksesoris',
      price: 129000,
      originalPrice: 169000,
      rating: 4.9,
      salesCount: 620,
      store: 'Eco Living',
      city: 'Semarang',
      badge: 'Diskon 23%',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 9,
      name: 'Nordic Ceramic Coffee Mug 350ml Handcrafted',
      category: 'Perlengkapan Rumah',
      price: 65000,
      rating: 4.9,
      salesCount: 140,
      store: 'Home Atelier',
      city: 'Bali',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 10,
      name: 'Aroma Diffuser Ultrasonic Wood Grain 400ml',
      category: 'Perlengkapan Rumah',
      price: 219000,
      originalPrice: 289000,
      rating: 4.7,
      salesCount: 95,
      store: 'Zen Living',
      city: 'Jakarta Pusat',
      badge: 'Promo',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 11,
      name: 'Premium Linen Oversized Casual Shirt',
      category: 'Fashion',
      price: 279000,
      rating: 4.8,
      salesCount: 52,
      store: 'Breeze Studio',
      city: 'Bandung',
      image: this.productSvc.defaultPlaceholder,
    },
    {
      id: 12,
      name: 'Matcha Ceremonial Grade Uji Kyoto 50g Tin',
      category: 'F&B',
      price: 165000,
      rating: 5.0,
      salesCount: 310,
      store: 'Tea & Co',
      city: 'Jakarta Selatan',
      badge: 'Impor',
      image: this.productSvc.defaultPlaceholder,
    },
  ];

  allProducts: CatalogProduct[] = [];

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.apiErrorMessage = '';

    this.productSvc.getProducts(this.searchQuery).subscribe({
      next: (apiProducts: BackendProduct[]) => {
        this.isLoading = false;
        this.hasApiConnected = true;

        if (
          apiProducts &&
          Array.isArray(apiProducts) &&
          apiProducts.length > 0
        ) {
          this.allProducts = apiProducts.map((p) =>
            this.mapBackendToCatalog(p),
          );
        } else if (
          apiProducts &&
          Array.isArray(apiProducts) &&
          apiProducts.length === 0
        ) {
          this.allProducts = [];
        } else {
          this.allProducts = [...this.mockFallbackProducts];
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.hasApiConnected = false;
        this.apiErrorMessage =
          'Tidak dapat menghubungi backend API (/api/products). Menampilkan data katalog demo.';
        console.warn('API getProducts error / server offline:', err);
        this.allProducts = [...this.mockFallbackProducts];
      },
    });
  }

  trackByProductId(index: number, item: CatalogProduct): number {
    return item.id;
  }

  private mapBackendToCatalog(p: BackendProduct): CatalogProduct {
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
      city: 'Jakarta',
      badge: p.productStock <= 5 ? 'Stok Terbatas' : undefined,
      image: this.productSvc.getProductImage(p),
    };
  }

  get filteredProducts(): CatalogProduct[] {
    const result = this.allProducts.filter((p) => {
      const matchCat =
        this.selectedCategory === 'Semua' ||
        p.category.toLowerCase() === this.selectedCategory.toLowerCase();
      const matchSearch =
        !this.searchQuery ||
        p.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchRating =
        this.selectedRating === 0 || p.rating >= this.selectedRating;
      return matchCat && matchSearch && matchRating;
    });

    if (this.selectedSort === 'price-asc') {
      return result.sort((a, b) => a.price - b.price);
    } else if (this.selectedSort === 'price-desc') {
      return result.sort((a, b) => b.price - a.price);
    } else if (this.selectedSort === 'rating') {
      return result.sort((a, b) => b.rating - a.rating);
    } else if (this.selectedSort === 'popular') {
      return result.sort((a, b) => b.salesCount - a.salesCount);
    }

    return result;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'Semua';
    this.selectedSort = 'popular';
    this.selectedRating = 0;
    this.loadProducts();
  }

  // --- FUNGSI UNTUK MENAMBAH KE KERANJANG ---
  addToCart(product: CatalogProduct): void {
    // Siapkan payload sesuai dengan CartItemPayload (yang dibutuhkan backend)
    const user: any = this.authSvc.getUser();
    const payload = {
      userId: user.id, // Anggap ID 1 (karena backend sebenarnya menggunakan JWT)
      productId: product.id,
      quantity: 1,
      totalPrice: product.price,
    };

    this.cartSvc.addItemToCart(payload).subscribe({
      next: (res) => {
        alert(`Berhasil menambahkan ${product.name} ke keranjang!`);
        // Opsional: pengguna langsung diarahkan ke halaman keranjang:
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        console.error('Gagal menambah ke keranjang', err);
        alert(
          'Gagal menambahkan ke keranjang. Pastikan Anda sudah login atau API berjalan.',
        );
      },
    });
  }
}
