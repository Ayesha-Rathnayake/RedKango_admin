export interface OrderItem {
  productDbId: number;
  productId: string;
  productName: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;

  items: OrderItem[];

  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;

  orderStatus: string;
  paymentStatus: string;

  courierName?: string;
  trackingNumber?: string;

  deliveryFullName?: string;
  deliveryPhone?: string;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryDistrict?: string;
  deliveryPostalCode?: string;

  createdAt: string;
  paidAt?: string;
  dispatchedAt?: string;
}

export interface DispatchOrderRequest {
  courierName: string;
  trackingNumber: string;
}