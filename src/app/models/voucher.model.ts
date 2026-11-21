export interface CreateVoucherPayload {
  code: string;
  discountPercentage: number;
  minPurchaseAmount: number;
  maxDiscountAmount: number;
}

export interface SellerVoucher extends CreateVoucherPayload {
  id: number;
  storeId: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}
