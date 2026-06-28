export interface AdminNotification {
  id: number;
  type: 'NEW_USER' | 'NEW_ORDER' | 'NEW_BOOKING' | 'NEW_REVIEW' | 'BOOKING_CANCELLED' | 'ORDER_CANCELLED';
  message: string;
  read: boolean;
  createdAt: number; // epoch millis
}
