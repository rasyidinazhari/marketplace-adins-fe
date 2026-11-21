export interface CartItemPayload {
    userId: number;
    productId: number;
    quantity: number;
    totalPrice: number;
}

export interface CartItemResponse {
    id: number;
    userId: number;
    userName: string;
    productId: number;
    productName: string;
    storeId: number;
    storeName: string;
    quantity: number;
    totalPrice: number;
    createdAt: string; 
    updatedAt: string; 
  }