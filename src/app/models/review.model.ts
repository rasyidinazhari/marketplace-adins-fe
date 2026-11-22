export interface ProductReview {
  id: number;
  productId: number;
  productName?: string;
  userId: number;
  userName?: string;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;

  // Frontend helper / fallback properties
  authorAvatar?: string;
  helpfulCount?: number;
}

export interface CreateReviewPayload {
  rating: number;
  comment: string;
  userId?: number;
  productId?: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { [stars: number]: number };
}
