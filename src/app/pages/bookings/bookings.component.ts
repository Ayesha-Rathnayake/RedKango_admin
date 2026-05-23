import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './bookings.component.html',
})
export class BookingsComponent implements OnInit {

  highlightedId: string | null = null;
  bookings: any[] = [];
  showModal = false;
  isEditing = false;

  newBooking = {
    bookingId: '',
    customerName: '',
    item: '',
    startDate: '',
    endDate: '',
    status: 'Pending',
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadBookings();

    // ✅ Check if navigated with a booking ID (e.g. from dashboard edit icon)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.highlightedId = params['id'];

        // Wait for bookings to be available, then open edit modal
        setTimeout(() => {
          const booking = this.bookings.find(b => b.bookingId === params['id']);
          if (booking) {
            this.openEditModal(booking);
          }

          // Also scroll the row into view behind the modal
          const el = document.getElementById('booking-' + this.highlightedId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    });
  }

  loadBookings() {
    this.bookings = [
      { bookingId: 'BK001', customerName: 'Sarah Johnson', item: '4-Person Family Tent', startDate: '05/10/2025', endDate: '08/10/2025', status: 'Confirmed' },
      { bookingId: 'BK002', customerName: 'Grace Taylor',  item: '4-Person Family Tent', startDate: '01/10/2025', endDate: '03/10/2025', status: 'Pending'   },
      { bookingId: 'BK003', customerName: 'Mark Jones',    item: '2-Person Dome Tent',   startDate: '24/09/2025', endDate: '26/09/2025', status: 'Confirmed' },
      { bookingId: 'BK004', customerName: 'Aria Nelson',   item: '6-Person Dome Tent',   startDate: '14/09/2025', endDate: '17/09/2025', status: 'Pending'   },
      { bookingId: 'BK005', customerName: 'James Silva',   item: '2-Person Dome Tent',   startDate: '10/09/2025', endDate: '12/09/2025', status: 'Cancelled' },
    ];
  }

  openAddModal() {
    this.isEditing = false;
    this.newBooking = { bookingId: '', customerName: '', item: '', startDate: '', endDate: '', status: 'Pending' };
    this.showModal = true;
  }

  openEditModal(booking: any) {
    this.isEditing = true;
    this.newBooking = { ...booking };
    this.showModal = true;
  }

  saveBooking() {
    if (this.isEditing) {
      const index = this.bookings.findIndex(b => b.bookingId === this.newBooking.bookingId);
      if (index !== -1) this.bookings[index] = { ...this.newBooking };
    } else {
      this.bookings.push({ ...this.newBooking });
    }
    this.highlightedId = null;
    this.showModal = false;
  }

  deleteBooking(id: string) {
    this.bookings = this.bookings.filter(b => b.bookingId !== id);
  }

  closeModal() {
    this.highlightedId = null;
    this.showModal = false;
  }
}