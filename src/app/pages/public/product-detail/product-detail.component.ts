import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';
import { ModalComponent } from '../../../components/ui/modal/modal.component';
import { ProductService } from '../../../services/product/product.service';
import { ReviewService } from '../../../services/review/review.service';
import { AuthService } from '../../../services/auth/auth.service';
import { ProductReview, ReviewStats } from '../../../models/review.model';

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
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent, ModalComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class PublicProductDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productSvc = inject(ProductService);
  private reviewSvc = inject(ReviewService);
  private authSvc = inject(AuthService);

  selectedImageIndex = 0;
  selectedColor = 'Midnight Black';
  quantity = 1;
  activeTab: 'deskripsi' | 'spesifikasi' | 'ulasan' = 'deskripsi';
  isWishlisted = false;
  addedToCartFeedback = false;

  // Review state
  reviews: ProductReview[] = [];
  isLoadingReviews = false;
  reviewStats: ReviewStats = {
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  // Review modal form state
  isReviewModalOpen = false;
  isSubmittingReview = false;
  reviewRating = 5;
  hoveredRating = 0;
  reviewComment = '';
  reviewError = '';
  reviewSuccessMessage = '';

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const numId = Number(id);
      this.loadProduct(numId);
      this.loadReviews(numId);
    }
  }

  loadProduct(id: number): void {
    this.productSvc.getProductById(id).subscribe({
      next: (data) => {
        if (data) {
          this.product.id = data.id;
          this.product.name = data.productName;
          this.product.price = data.productPrice;
          this.product.stock = data.productStock;
          this.product.category = data.categories?.[0]?.categoryName || 
            data.productCategories?.[0]?.category?.categoryName || 
            'Elektronik';
          this.product.store.name = data.store?.storeName || data.storeName || 'Adins Official Store';
          if (data.productDescription) {
            this.product.description = [data.productDescription];
          }
          this.product.images = [this.productSvc.getProductImage(data)];
          this.selectedImageIndex = 0;
        }
      },
      error: (err) => {
        console.warn('Gagal memuat produk dari API, fallback ke default detail:', err);
      }
    });
  }

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

  loadReviews(productId: number): void {
    this.isLoadingReviews = true;
    this.reviewSvc.getReviewsByProductId(productId).subscribe({
      next: (data) => {
        this.reviews = data;
        this.reviewStats = this.reviewSvc.calculateStats(data);
        if (data.length > 0) {
          this.product.rating = this.reviewStats.averageRating;
          this.product.ratingCount = this.reviewStats.totalReviews;
        }
        this.isLoadingReviews = false;
      },
      error: (err) => {
        console.warn('Gagal memuat ulasan produk:', err);
        this.isLoadingReviews = false;
      },
    });
  }

  openReviewModal(): void {
    const token = this.authSvc.getToken();
    if (!token) {
      this.router.navigate(['/buyer/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.reviewRating = 5;
    this.hoveredRating = 0;
    this.reviewComment = '';
    this.reviewError = '';
    this.reviewSuccessMessage = '';
    this.isReviewModalOpen = true;
  }

  closeReviewModal(): void {
    this.isReviewModalOpen = false;
    this.reviewError = '';
  }

  setRating(rating: number): void {
    this.reviewRating = rating;
  }

  submitReview(): void {
    if (this.reviewRating < 1 || this.reviewRating > 5) {
      this.reviewError = 'Pilih rating bintang antara 1 sampai 5.';
      return;
    }

    if (!this.reviewComment.trim()) {
      this.reviewError = 'Mohon tulis komentar ulasan Anda.';
      return;
    }

    this.isSubmittingReview = true;
    this.reviewError = '';
    this.reviewSuccessMessage = '';

    this.reviewSvc
      .createReview(this.product.id, {
        rating: this.reviewRating,
        comment: this.reviewComment.trim(),
      })
      .subscribe({
        next: () => {
          this.isSubmittingReview = false;
          this.reviewSuccessMessage = 'Ulasan Anda berhasil dikirim!';
          this.loadReviews(this.product.id);
          setTimeout(() => {
            this.closeReviewModal();
            this.reviewSuccessMessage = '';
          }, 1500);
        },
        error: (err) => {
          this.isSubmittingReview = false;
          this.reviewError =
            err.error?.message || 'Gagal mengirim ulasan. Silakan periksa koneksi Anda dan coba lagi.';
        },
      });
  }
}
