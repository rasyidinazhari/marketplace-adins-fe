import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CreateReviewPayload, ProductReview, ReviewStats } from '../../models/review.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Mengambil daftar review untuk produk tertentu.
   * Dilengkapi penanganan defensif jika backend me-return null saat kosong.
   */
  getReviewsByProductId(productId: number): Observable<ProductReview[]> {
    return this.http
      .get<ProductReview[] | null>(`${environment.apiUrl}/products/${productId}/reviews`)
      .pipe(
        map((reviews) => {
          if (!reviews || !Array.isArray(reviews)) {
            return [];
          }
          return reviews.map((r) => this.normalizeReview(r));
        })
      );
  }

  /**
   * Menambahkan ulasan baru ke produk.
   * Menyertakan userId dan productId di body sebagai antisipasi validasi backend saat ini.
   */
  createReview(
    productId: number,
    data: { rating: number; comment: string }
  ): Observable<ProductReview> {
    const user = this.authService.getUser();
    const payload: CreateReviewPayload = {
      productId,
      userId: user?.id ?? 0,
      rating: data.rating,
      comment: data.comment,
    };

    return this.http
      .post<ProductReview>(`${environment.apiUrl}/products/${productId}/reviews`, payload)
      .pipe(
        map((review) => {
          const normalized = this.normalizeReview(review);
          if (!normalized.userName && user?.name) {
            normalized.userName = user.name;
          }
          return normalized;
        })
      );
  }

  /**
   * Menghitung rata-rata bintang dan distribusi review
   */
  calculateStats(reviews: ProductReview[]): ReviewStats {
    const breakdown: { [stars: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (!reviews || reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: breakdown,
      };
    }

    let sum = 0;
    for (const r of reviews) {
      const roundedRating = Math.min(5, Math.max(1, Math.round(r.rating || 0)));
      breakdown[roundedRating] = (breakdown[roundedRating] || 0) + 1;
      sum += r.rating || 0;
    }

    const averageRating = Math.round((sum / reviews.length) * 10) / 10;

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingBreakdown: breakdown,
    };
  }

  /**
   * Normalisasi item ulasan agar siap dirender oleh UI
   */
  private normalizeReview(raw: any): ProductReview {
    const userName = raw.userName || raw.user?.name || 'Pembeli WarungAdins';
    const initials = encodeURIComponent(userName);

    return {
      id: raw.id,
      productId: raw.productId,
      productName: raw.productName || raw.product?.productName || '',
      userId: raw.userId,
      userName: userName,
      rating: raw.rating ?? 5,
      comment: raw.comment || raw.Comment || '',
      createdAt: raw.createdAt || raw.CreatedAt || raw.created_at || new Date().toISOString(),
      updatedAt: raw.updatedAt || raw.UpdatedAt || raw.updated_at,
      authorAvatar: `https://ui-avatars.com/api/?name=${initials}&background=09090b&color=ffffff&bold=true&size=100`,
      helpfulCount: raw.helpfulCount ?? 0,
    };
  }
}
