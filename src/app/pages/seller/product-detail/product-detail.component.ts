import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent {
  isEditMode = false;
  isSaving = false;

  formData = {
    name: 'Wireless Noise-Cancelling Headphones Pro ANC',
    sku: 'AUD-HDP-001',
    category: 'Elektronik',
    price: 1499000,
    originalPrice: 1999000,
    stock: 35,
    weight: 450,
    status: 'Aktif',
    description: 'Headphone nirkabel kelas studio dengan peredam bising aktif (ANC) mutakhir, daya tahan baterai hingga 40 jam, dan suara bass bertenaga jernih. Dilengkapi mikrofon dual-beamforming untuk komunikasi panggilan telepon sejernih kristal.',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80'
    ]
  };

  categories = ['Elektronik', 'Fashion', 'F&B', 'Aksesoris', 'Perlengkapan Rumah'];

  constructor(private router: Router, private route: ActivatedRoute) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
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
        images: []
      };
    }
  }

  saveProduct(): void {
    this.isSaving = true;
    setTimeout(() => {
      this.isSaving = false;
      this.router.navigate(['/seller/products']);
    }, 600);
  }
}
