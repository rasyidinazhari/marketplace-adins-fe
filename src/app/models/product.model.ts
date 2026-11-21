export interface CategoryItem {
  id: number;
  categoryName: string;
}

export interface ProductCategoryRelation {
  productId?: number;
  categoryId: number;
  category?: CategoryItem;
}

export interface StoreSummary {
  id: number;
  storeName: string;
  userId?: number;
}

export interface BackendProduct {
  id: number;
  storeId: number;
  storeName?: string;
  store?: StoreSummary;
  productName: string;
  productDescription?: string;
  productPrice: number;
  productStock: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  categories?: CategoryItem[];
  productCategories?: ProductCategoryRelation[];
  imageUrl?: string;
}

export interface SellerProduct extends Omit<BackendProduct,
  'productName' | 'productDescription' | 'productPrice' | 'productStock'> {
  productName: string | null;
  productDescription?: string | null;
  productPrice: number | null;
  productStock: number | null;
}

export interface CreateProductPayload {
  storeId: number;
  categoryIds: number[];
  productName: string;
  productDescription?: string;
  productPrice: number;
  productStock: number;
}

export interface UpdateProductPayload {
  categoryIds?: number[];
  productName?: string;
  productDescription?: string;
  productPrice?: number;
  productStock?: number;
  expectedStock?: number | null;
}
