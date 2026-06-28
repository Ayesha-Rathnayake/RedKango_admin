import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { AdminService } from '../../services/admin.service';
import { Booking } from '../../models/booking.model';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  loading = false;
  errorMessage = '';

  // Revenue
  totalCollectedRevenue = 0;
  salesRevenue = 0;
  rentalRevenueCollected = 0;
  pendingCodAmount = 0;

  // Activity
  activeRentals = 0;
  totalBookings = 0;
  totalOrders = 0;
  productsSold = 0;
  newBookingsToday = 0;

  // Cancellations
  cancelledBookings = 0;
  cancelledAfterPayment = 0;
  cancelledAdvanceKept = 0;


  recentBookings: Booking[] = [];

  constructor(
    private router: Router,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getBookings().subscribe({
      next: (bookings) => {
        this.prepareBookingStats(bookings);
        this.loadOrderStats();
      },
      error: () => {
        this.errorMessage = 'Failed to load dashboard data.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadOrderStats(): void {
    this.adminService.getOrders().subscribe({
      next: (orders) => {
        this.prepareOrderStats(orders);
        this.totalCollectedRevenue = this.salesRevenue + this.rentalRevenueCollected;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.totalCollectedRevenue = this.rentalRevenueCollected;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

 private prepareBookingStats(bookings: Booking[]): void {
  const activeStatuses = ['CONFIRMED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'RENTED'];

  this.activeRentals = bookings.filter((b) =>
    activeStatuses.includes(b.bookingStatus)
  ).length;

  this.totalBookings = bookings.length;

  this.newBookingsToday = bookings.filter((b) =>
    this.isToday(b.createdAt)
  ).length;

  // Rental revenue collected — includes cancelled bookings where advance was paid
  // (advance is non-refundable so it's kept as revenue)
  this.rentalRevenueCollected = bookings.reduce((sum, b) => {
    if (b.paymentStatus === 'FULLY_PAID') {
      // Full amount collected
      return sum + Number(b.totalAmount || 0);
    } else if (b.paymentStatus === 'ADVANCE_PAID') {
      // Advance collected — counts regardless of booking status (even if cancelled)
      return sum + Number(b.advanceAmount || 0);
    } else if (b.paymentStatus === 'CANCELLED' && Number(b.advanceAmount || 0) > 0) {
      // Cancelled after advance payment — advance is still kept as revenue
      return sum + Number(b.advanceAmount || 0);
    }
    return sum;
  }, 0);

  // Pending COD — only for ACTIVE bookings with ADVANCE_PAID (not cancelled)
  this.pendingCodAmount = bookings
    .filter((b) =>
      b.paymentStatus === 'ADVANCE_PAID' &&
      b.bookingStatus !== 'CANCELLED'
    )
    .reduce((sum, b) => sum + Number(b.remainingAmount || 0), 0);
    this.cancelledBookings = bookings.filter(
      (b) => b.bookingStatus === 'CANCELLED'
    ).length;

    // Only count cancellations where advance was actually paid
    // advancePaidAt being set means the payment was received before cancellation
    this.cancelledAfterPayment = bookings.filter(
      (b) => b.bookingStatus === 'CANCELLED' && b.advancePaidAt != null
    ).length;

    this.cancelledAdvanceKept = bookings
      .filter((b) => b.bookingStatus === 'CANCELLED' && b.advancePaidAt != null)
      .reduce((sum, b) => sum + Number(b.advanceAmount || 0), 0);


  this.recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
}


  private prepareOrderStats(orders: Order[]): void {
    this.totalOrders = orders.length;

    // Sales revenue — only from PAID orders
    this.salesRevenue = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // Products sold — from non-cancelled orders
    this.productsSold = orders
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => {
        const items = o.items || [];
        return sum + items.reduce((s, i) => s + Number(i.quantity || 0), 0);
      }, 0);
  }

  private isToday(dateValue: string): boolean {
    if (!dateValue) return false;
    const date = new Date(dateValue);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  viewBooking(bookingNumber: string): void {
    this.router.navigateByUrl(`/bookings/${bookingNumber}`);
  }

  getItemsText(booking: Booking): string {
    if (!booking.items || booking.items.length === 0) return 'No items';
    return booking.items
      .map((item) => `${item.productName} x ${item.quantity}`)
      .join(', ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING_PAYMENT':    return 'bg-gray-100 text-gray-700';
      case 'CONFIRMED':          return 'bg-blue-100 text-blue-700';
      case 'READY_FOR_DISPATCH': return 'bg-indigo-100 text-indigo-700';
      case 'DISPATCHED':         return 'bg-purple-100 text-purple-700';
      case 'RENTED':             return 'bg-yellow-100 text-yellow-700';
      case 'RETURNED':           return 'bg-orange-100 text-orange-700';
      case 'COMPLETED':          return 'bg-green-100 text-green-700';
      case 'CANCELLED':          return 'bg-red-100 text-red-700';
      default:                   return 'bg-gray-100 text-gray-700';
    }
  }
}
