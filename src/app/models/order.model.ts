import { OrderItemResponse } from './orderItem.model';

export enum OrderStatus {
    PENDING_PAYMENT = 0,
    ON_PROCESS = 1,
    ON_DELIVERY = 2,
    DELIVERED = 3,
}

// Payload untuk membuat pesanan baru (POST)
export interface OrderPayload {
    storeId: number;
    addressId: number;
    voucherId?: number;
    voucherCode?: string | null; // Sesuai CheckoutRequest (opsional)
}

// Payload untuk mengubah status pesanan (PATCH)
export interface UpdateOrderStatusPayload {
    status: keyof typeof OrderStatus;
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
    totalBeforeDisc: number;
    totalAfterDisc: number | null;
    orderStatus: OrderStatus;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface OrderDetailResponse extends OrderResponse {
    items: OrderItemResponse[];
    phoneNumber: string;
    fullAddress: string | null;
    city: string;
    postalCode: string;
}
