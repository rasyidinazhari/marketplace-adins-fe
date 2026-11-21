export interface OrderItemResponse {
    id: number;
    orderId: number;
    productId: number;
    productName: string;
    quantity: number;
    priceAtPurchase: number;
    createdAt: string;
    updatedAt: string;
  }