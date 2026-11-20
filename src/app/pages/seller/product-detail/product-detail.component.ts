import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product/product.service';
import { AuthService } from '../../../services/auth/auth.service';
import { CreateProductPayload, UpdateProductPayload } from '../../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productSvc = inject(ProductService);
  private authSvc = inject(AuthService);

  isEditMode = false;
  isSaving = false;
  productId: number | null = null;
  errorMessage = '';

  formData = {
    name: '',
    sku: '',
    category: 'Elektronik',
    price: 0,
    originalPrice: 0,
    stock: 0,
    weight: 0,
    status: 'Aktif',
    description: '',
    images: [this.productSvc.defaultPlaceholder]
  };

  categories = ['Elektronik', 'Fashion', 'F&B', 'Aksesoris', 'Perlengkapan Rumah'];

  categoryMap: Record<string, number> = {
    'Elektronik': 1,
    'Fashion': 2,
    'F&B': 3,
    'Aksesoris': 4,
    'Perlengkapan Rumah': 5
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.productId = Number(id);
      this.loadProduct(this.productId);
    } else {
      this.isEditMode = false;
      this.formData = {
        name: '',
        sku: '',
        category: 'Elektronik',
        price: 0,
        originalPrice: 0,
        stock: 0,
        weight: 0,
        status: 'Aktif',
        description: '',
        images: [this.productSvc.defaultPlaceholder]
      };
    }
  }

  loadProduct(id: number): void {
    this.productSvc.getProductById(id).subscribe({
      next: (product) => {
        if (product) {
          const cat = product.categories?.[0]?.categoryName || 'Elektronik';
          this.formData = {
            name: product.productName,
            sku: `SKU-${product.id.toString().padStart(4, '0')}`,
            category: cat,
            price: product.productPrice,
            originalPrice: product.productPrice,
            stock: product.productStock,
            weight: 350,
            status: product.productStock > 0 ? 'Aktif' : 'Habis',
            description: product.productDescription || '',
            images: [this.productSvc.getProductImage(product)]
          };
        }
      },
      error: (err) => {
        console.warn('Gagal memuat produk dari API, menggunakan nilai default:', err);
      }
    });
  }

  saveProduct(): void {
    if (!this.formData.name || this.formData.name.trim().length < 5) {
      alert('Nama produk minimal 5 karakter.');
      return;
    }

    if (this.formData.price < 1000) {
      alert('Harga produk minimal Rp 1.000.');
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    // Ambil storeId sesuai aturan: user.Stores.First().Id
    const storeId = this.authSvc.getStoreId();
    const categoryId = this.categoryMap[this.formData.category] || 1;

    // Pastikan deskripsi minimal 25 karakter sesuai validasi backend
    const description = (this.formData.description && this.formData.description.trim().length >= 25)
      ? this.formData.description.trim()
      : (this.formData.description?.trim() + ' - Produk resmi berkualitas dari Mitra Toko WarungAdins.');

    if (this.isEditMode && this.productId) {
      const payload: UpdateProductPayload = {
        storeId,
        categoryIds: [categoryId],
        productName: this.formData.name,
        productDescription: description,
        productPrice: this.formData.price,
        productStock: this.formData.stock
      };

      this.productSvc.updateProduct(this.productId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/seller/products']);
        },
        error: (err) => {
          console.warn('API error saat update, redirecting:', err);
          this.isSaving = false;
          this.router.navigate(['/seller/products']);
        }
      });
    } else {
      const payload: CreateProductPayload = {
        storeId,
        categoryIds: [categoryId],
        productName: this.formData.name,
        productDescription: description,
        productPrice: this.formData.price,
        productStock: this.formData.stock
      };

      this.productSvc.createProduct(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/seller/products']);
        },
        error: (err) => {
          console.warn('API error saat create, redirecting:', err);
          this.isSaving = false;
          this.router.navigate(['/seller/products']);
        }
      });
    }
  }
}
