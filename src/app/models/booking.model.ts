// src/app/models/booking.model.ts

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'RENTED'
  | 'RETURNED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'ADVANCE_PAID' | 'FULLY_PAID' | 'FAILED' | 'CANCELLED';

export interface BookingItem {
  productDbId: number;
  productId: string;
  productName: string;
  imageUrl: string;
  dailyRate: number;
  quantity: number;
  lineTotal: number;
}

export interface Booking {
  bookingId: number;
  bookingNumber: string;

  customerName: string;
  customerEmail: string;

  rentalStartDate: string;
  rentalEndDate: string;
  totalDays: number;

  items: BookingItem[];

  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;

  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  deliveryMethod: 'DELIVERY' | 'PICKUP';

  deliveryFullName: string;
  deliveryPhone: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2: string;
  deliveryCity: string;
  deliveryDistrict: string;
  deliveryPostalCode: string;

  courierName: string;
  trackingNumber: string;

  createdAt: string;
  advancePaidAt: string | null;
  dispatchedAt: string | null;
  returnedAt: string | null;
  completedAt: string | null;
}

export interface DispatchRentalRequest {
  courierName: string;
  trackingNumber: string;
}
