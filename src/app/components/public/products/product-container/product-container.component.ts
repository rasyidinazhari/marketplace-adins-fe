import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  styleUrl: './product-container.component.css'
})
export class ProductContainerComponent {
  searchQuery = '';
  selectedCategory = 'Semua';
  selectedSort = 'popular';
  selectedRating = 0;

  categories = ['Semua', 'Elektronik', 'Fashion', 'F&B', 'Aksesoris', 'Perlengkapan Rumah'];

  allProducts: CatalogProduct[] = [
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
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80'
    }
  ];

  get filteredProducts(): CatalogProduct[] {
    return this.allProducts.filter(p => {
      const matchCat = this.selectedCategory === 'Semua' || p.category === this.selectedCategory;
      const matchSearch = !this.searchQuery || p.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchRating = this.selectedRating === 0 || p.rating >= this.selectedRating;
      return matchCat && matchSearch && matchRating;
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'Semua';
    this.selectedSort = 'popular';
    this.selectedRating = 0;
  }
}
