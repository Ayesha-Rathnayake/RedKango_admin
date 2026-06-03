import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  Booking,
  DispatchRentalRequest,
} from '../../models/booking.model';

import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './bookings.component.html',
})
export class BookingsComponent implements OnInit {
  highlightedId: string | null = null;

  bookings: Booking[] = [];
  paginatedBookings: Booking[] = [];

  selectedBooking: Booking | null = null;

  loading = false;
  successMessage = '';
  errorMessage = '';

  showDetailsModal = false;
  showDispatchModal = false;

  dispatchForm: DispatchRentalRequest = {
    courierName: '',
    trackingNumber: '',
  };

  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBookings();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.highlightedId = params['id'];

        setTimeout(() => {
          const booking = this.bookings.find(
            (b) => b.bookingNumber === params['id']
          );

          if (booking) {
            this.openDetailsModal(booking);
          }

          const el = document.getElementById('booking-' + this.highlightedId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          this.cdr.detectChanges();
        }, 300);
      }
    });
  }

  loadBookings(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.adminService.getBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        this.totalPages =
          Math.ceil(this.bookings.length / this.itemsPerPage) || 1;

        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
        }

        this.updatePagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Failed to load rental bookings.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBookings = this.bookings.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.updatePagination();
  }

  openDetailsModal(booking: Booking): void {
    this.selectedBooking = booking;
    this.showDetailsModal = true;
    this.cdr.detectChanges();
  }

  closeDetailsModal(): void {
    this.selectedBooking = null;
    this.showDetailsModal = false;
    this.highlightedId = null;
    this.cdr.detectChanges();
  }

  openDispatchModal(booking: Booking): void {
    this.selectedBooking = booking;
    this.dispatchForm = {
      courierName: booking.courierName || '',
      trackingNumber: booking.trackingNumber || '',
    };
    this.showDispatchModal = true;
    this.cdr.detectChanges();
  }

  closeDispatchModal(): void {
    this.showDispatchModal = false;
    this.dispatchForm = {
      courierName: '',
      trackingNumber: '',
    };
    this.cdr.detectChanges();
  }

  dispatchBooking(): void {
    if (!this.selectedBooking) {
      return;
    }

    if (!this.dispatchForm.courierName.trim()) {
      this.errorMessage = 'Courier name is required.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.dispatchForm.trackingNumber.trim()) {
      this.errorMessage = 'Tracking number is required.';
      this.cdr.detectChanges();
      return;
    }

    this.adminService
      .dispatchBooking(this.selectedBooking.bookingId, this.dispatchForm)
      .subscribe({
        next: () => {
          this.successMessage = 'Booking dispatched successfully.';
          this.errorMessage = '';
          this.closeDispatchModal();
          this.closeDetailsModal();
          this.loadBookings();
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || 'Failed to dispatch booking.';
          this.cdr.detectChanges();
        },
      });
  }

  markAsRented(booking: Booking): void {
    this.adminService.markBookingAsRented(booking.bookingId).subscribe({
      next: () => {
        this.successMessage = 'Booking marked as rented.';
        this.errorMessage = '';
        this.closeDetailsModal();
        this.loadBookings();
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Failed to mark booking as rented.';
        this.cdr.detectChanges();
      },
    });
  }

  markAsReturned(booking: Booking): void {
    this.adminService.markBookingAsReturned(booking.bookingId).subscribe({
      next: () => {
        this.successMessage = 'Booking marked as returned.';
        this.errorMessage = '';
        this.closeDetailsModal();
        this.loadBookings();
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Failed to mark booking as returned.';
        this.cdr.detectChanges();
      },
    });
  }

  completeBooking(booking: Booking): void {
    this.adminService.completeBooking(booking.bookingId).subscribe({
      next: () => {
        this.successMessage = 'Booking completed successfully.';
        this.errorMessage = '';
        this.closeDetailsModal();
        this.loadBookings();
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Failed to complete booking.';
        this.cdr.detectChanges();
      },
    });
  }

  getItemsText(booking: Booking): string {
    if (!booking.items || booking.items.length === 0) {
      return 'No items';
    }

    return booking.items
      .map((item) => `${item.productName} x ${item.quantity}`)
      .join(', ');
  }

  getDeliveryAddress(booking: Booking): string {
    return [
      booking.deliveryAddressLine1,
      booking.deliveryAddressLine2,
      booking.deliveryCity,
      booking.deliveryDistrict,
      booking.deliveryPostalCode,
    ]
      .filter(Boolean)
      .join(', ');
  }

  getBookingStatusClass(status: string): string {
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

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'ADVANCE_PAID':
        return 'bg-green-100 text-green-700';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  }
}