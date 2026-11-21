// Payload untuk membuat pesanan baru (POST)
export interface OrderPayload {
    storeId: number;
    addressId: number;
    voucherCode?: string | null; // Sesuai CheckoutRequest (opsional)
}

// Payload untuk mengubah status pesanan (PATCH)
export interface UpdateOrderStatusPayload {
    status: string; // Contoh: "Paid", "Shipped", "Completed"
}

// Response dari API
export interface OrderResponse {
    id: number;
    userId: number;
    userName: string;
    storeId: number;
    storeName: string;
    addressId: number;
    recipientName: string;
    voucherId: number | null;
    voucherCode: string | null;
    discountAmount: number | null;
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
    orderStatus: string;
    createdAt: string; 
    updatedAt: string; 
}