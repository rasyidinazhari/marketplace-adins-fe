import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';

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
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent {
  searchQuery = '';
  selectedCategory = 'Semua';

  categories = ['Semua', 'Elektronik', 'Fashion', 'F&B', 'Aksesoris'];

  products: SellerProduct[] = [
    {
      id: 1,
      name: 'Wireless Noise-Cancelling Headphones Pro ANC',
      sku: 'AUD-HDP-001',
      category: 'Elektronik',
      price: 1499000,
      stock: 35,
      status: 'Aktif',
      salesCount: 320,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'
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
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80'
    }
  ];

  get filteredProducts(): SellerProduct[] {
    return this.products.filter(p => {
      const matchCat = this.selectedCategory === 'Semua' || p.category === this.selectedCategory;
      const matchSearch = !this.searchQuery || p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  deleteProduct(id: number): void {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini dari toko?')) {
      this.products = this.products.filter(p => p.id !== id);
    }
  }

  toggleStatus(product: SellerProduct): void {
    product.status = product.status === 'Aktif' ? 'Draft' : 'Aktif';
  }
}
