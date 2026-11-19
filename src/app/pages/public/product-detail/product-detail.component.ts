import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';

export interface ProductDetailData {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  ratingCount: number;
  salesCount: number;
  stock: number;
  store: {
    name: string;
    city: string;
    avatar: string;
    rating: number;
    responseTime: string;
    joinedYear: string;
    isOfficial: boolean;
  };
  images: string[];
  variants: {
    name: string;
    options: string[];
  }[];
  specifications: { key: string; value: string }[];
  description: string[];
  reviews: {
    id: number;
    author: string;
    avatar: string;
    rating: number;
    date: string;
    variant: string;
    comment: string;
    helpfulCount: number;
  }[];
}

@Component({
  selector: 'app-public-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class PublicProductDetailComponent {
  selectedImageIndex = 0;
  selectedColor = 'Midnight Black';
  quantity = 1;
  activeTab: 'deskripsi' | 'spesifikasi' | 'ulasan' = 'deskripsi';
  isWishlisted = false;
  addedToCartFeedback = false;

  product: ProductDetailData = {
    id: 1,
    name: 'Wireless Noise-Cancelling Headphones Pro ANC Audio Studio Hi-Res',
    category: 'Elektronik',
    price: 1499000,
    originalPrice: 1999000,
    discountPercent: 25,
    rating: 4.9,
    ratingCount: 320,
    salesCount: 850,
    stock: 35,
    store: {
      name: 'Adins Audio Store',
      city: 'Jakarta Selatan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      rating: 4.9,
      responseTime: '< 10 Menit',
      joinedYear: '2023',
      isOfficial: true
    },
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80'
    ],
    variants: [
      {
        name: 'Pilihan Warna',
        options: ['Midnight Black', 'Matte White', 'Space Silver']
      }
    ],
    specifications: [
      { key: 'Konektivitas', value: 'Bluetooth 5.3 & AUX 3.5mm Jack' },
      { key: 'Daya Tahan Baterai', value: 'Hingga 40 Jam (ANC On) / 55 Jam (ANC Off)' },
      { key: 'Waktu Pengisian', value: 'Fast Charging USB-C (10 Menit untuk 5 Jam Musik)' },
      { key: 'Driver Suara', value: '40mm Custom Titanium Driver' },
      { key: 'Peredam Bising', value: 'Hybrid Active Noise Cancellation (-38dB)' },
      { key: 'Berat Produk', value: '254 Gram' },
      { key: 'Garansi Resmi', value: '12 Bulan Resmi Distributor Indonesia' }
    ],
    description: [
      'Rasakan pengalaman audio level studio di mana saja dengan Wireless Noise-Cancelling Headphones Pro ANC. Ditenagai oleh driver titanium 40mm beresolusi tinggi (Hi-Res Audio Certified) yang menghadirkan bass mendalam dan vokal jernih tanpa distorsi.',
      'Fitur Hybrid ANC mutakhir mampu meredam hingga 95% kebisingan lingkungan sekitar seperti suara mesin pesawat, keramaian kantor, atau lalu lintas jalan raya.',
      'Bantalan telinga memory-foam berlapis breathable protein leather memberikan kenyamanan maksimal untuk pemakaian seharian penuh tanpa rasa panas atau tekanan berlebih pada kepala.'
    ],
    reviews: [
      {
        id: 101,
        author: 'Rian Pratama',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: '17 Nov 2026',
        variant: 'Midnight Black',
        comment: 'Kualitas suara luar biasa di harga 1 jutaan! ANC-nya beneran kedap banget, pas dipakai di KRL langsung hening. Build quality sangat solid dan kokoh.',
        helpfulCount: 24
      },
      {
        id: 102,
        author: 'Nadia Salsabila',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: '12 Nov 2026',
        variant: 'Matte White',
        comment: 'Warna putihnya estetik abis! Nyaman banget dipakai kerja remote seharian, telinga nggak sakit sama sekali. Baterainya juga awet seminggu baru ngecas.',
        helpfulCount: 16
      },
      {
        id: 103,
        author: 'Kevin Chandra',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        rating: 4,
        date: '08 Nov 2026',
        variant: 'Space Silver',
        comment: 'Pengiriman dari seller super cepat, packing bubble tebal. Suara bass mantap. Mikrofon untuk meeting zoom juga sangat jernih.',
        helpfulCount: 9
      }
    ]
  };

  relatedProducts = [
    {
      id: 2,
      name: 'Smartwatch Ultra 2 Cellular Titanium 49mm',
      category: 'Elektronik',
      price: 3250000,
      rating: 4.8,
      salesCount: 154,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 5,
      name: 'Ergonomic Mechanical Keyboard 75% Wireless',
      category: 'Elektronik',
      price: 890000,
      originalPrice: 1100000,
      rating: 4.9,
      salesCount: 210,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 8,
      name: 'Insulated Stainless Steel Tumbler 600ml',
      category: 'Aksesoris',
      price: 129000,
      originalPrice: 169000,
      rating: 4.9,
      salesCount: 620,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 4,
      name: 'Signature Arabica Coffee Beans 250g',
      category: 'F&B',
      price: 85000,
      rating: 5.0,
      salesCount: 450,
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80'
    }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  get currentImage(): string {
    return this.product.images[this.selectedImageIndex];
  }

  updateQuantity(delta: number): void {
    const next = this.quantity + delta;
    if (next >= 1 && next <= this.product.stock) {
      this.quantity = next;
    }
  }

  get totalPrice(): number {
    return this.product.price * this.quantity;
  }

  addToCart(): void {
    this.addedToCartFeedback = true;
    setTimeout(() => {
      this.addedToCartFeedback = false;
      this.router.navigate(['/cart']);
    }, 700);
  }

  buyNow(): void {
    this.router.navigate(['/checkout']);
  }
}
