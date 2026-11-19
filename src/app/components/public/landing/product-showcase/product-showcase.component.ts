import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface ProductItem {
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
export class ProductShowcaseComponent {
  selectedCategory = 'Semua';
  categories = ['Semua', 'Elektronik', 'Fashion', 'F&B', 'Aksesoris'];

  products: ProductItem[] = [
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
      badge: 'Terlaris',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
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
      badge: 'Official Store',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
    }
  ];

  get filteredProducts(): ProductItem[] {
    if (this.selectedCategory === 'Semua') {
      return this.products;
    }
    return this.products.filter(p => p.category === this.selectedCategory);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }
}
