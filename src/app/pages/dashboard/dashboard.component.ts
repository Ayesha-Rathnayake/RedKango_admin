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

  totalRevenue = 0;
  activeBookings = 0;
  productsSold = 0;

  newBookingsToday = 0;
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
        this.errorMessage = 'Failed to load dashboard booking data.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadOrderStats(): void {
    this.adminService.getOrders().subscribe({
      next: (orders) => {
        this.prepareOrderStats(orders);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private prepareBookingStats(bookings: Booking[]): void {
    const activeStatuses = [
      'CONFIRMED',
      'READY_FOR_DISPATCH',
      'DISPATCHED',
      'RENTED',
      'RETURNED',
    ];

    this.activeBookings = bookings.filter((booking) =>
      activeStatuses.includes(booking.bookingStatus)
    ).length;

    this.newBookingsToday = bookings.filter((booking) =>
      this.isToday(booking.createdAt)
    ).length;

    const rentalRevenue = bookings
      .filter((booking) =>
        booking.paymentStatus === 'ADVANCE_PAID' ||
        booking.bookingStatus === 'COMPLETED'
      )
      .reduce((sum, booking) => sum + Number(booking.advanceAmount || 0), 0);

    this.totalRevenue += rentalRevenue;

    this.recentBookings = [...bookings]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }

  private prepareOrderStats(orders: Order[]): void {
    const orderRevenue = orders
      .filter((order) => this.getOrderStatus(order) !== 'CANCELLED')
      .reduce((sum, order) => sum + this.getOrderTotal(order), 0);

    this.totalRevenue += orderRevenue;

    this.productsSold = orders
      .filter((order) => this.getOrderStatus(order) !== 'CANCELLED')
      .reduce((sum, order) => sum + this.getOrderItemQuantity(order), 0);
  }

  private getOrderStatus(order: Order): string {
    const value = order as unknown as { orderStatus?: string };
    return value.orderStatus || '';
  }

  private getOrderTotal(order: Order): number {
    const value = order as unknown as { totalAmount?: number };
    return Number(value.totalAmount || 0);
  }

  private getOrderItemQuantity(order: Order): number {
    const value = order as unknown as {
      items?: { quantity?: number }[];
    };

    if (!value.items) {
      return 0;
    }

    return value.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }

  private isToday(dateValue: string): boolean {
    if (!dateValue) {
      return false;
    }

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
    if (!booking.items || booking.items.length === 0) {
      return 'No items';
    }

    return booking.items
      .map((item) => `${item.productName} x ${item.quantity}`)
      .join(', ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'bg-gray-100 text-gray-700';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-700';
      case 'READY_FOR_DISPATCH':
        return 'bg-indigo-100 text-indigo-700';
      case 'DISPATCHED':
        return 'bg-purple-100 text-purple-700';
      case 'RENTED':
        return 'bg-yellow-100 text-yellow-700';
      case 'RETURNED':
        return 'bg-orange-100 text-orange-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}