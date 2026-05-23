import { Component, OnInit } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  constructor(private router: Router) {}

  totalRevenue = 56000;
  activeBookings = 48;
  productsSold = 156;

  recentBookings: any[] = [];

  ngOnInit() {
    this.recentBookings = [
      { bookingId: 'BK001', customerName: 'Sarah Johnson', item: '4-Person Family Tent', date: '05/10/2025', status: 'Confirmed' },
      { bookingId: 'BK002', customerName: 'Grace Taylor', item: '4-Person Family Tent', date: '01/10/2025', status: 'Pending' },
    ];
  }

  deleteBooking(id: string) {
    this.recentBookings = this.recentBookings.filter(b => b.bookingId !== id);
  }

editBooking(id: string) {
  this.router.navigateByUrl(`/bookings/${id}`);
}
}