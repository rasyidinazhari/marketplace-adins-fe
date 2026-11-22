import { OrderStatus } from '../../models/order.model';

export const sellerOrderStatuses = [
  {
    value: OrderStatus.PENDING_PAYMENT,
    label: 'Menunggu Pembayaran',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  {
    value: OrderStatus.ON_PROCESS,
    label: 'Perlu Dikirim',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  {
    value: OrderStatus.ON_DELIVERY,
    label: 'Dalam Pengiriman',
    className: 'border-purple-200 bg-purple-50 text-purple-700',
  },
  {
    value: OrderStatus.DELIVERED,
    label: 'Selesai',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
] as const;

export function getSellerOrderStatus(status: OrderStatus) {
  return sellerOrderStatuses.find(entry => entry.value === status);
}
