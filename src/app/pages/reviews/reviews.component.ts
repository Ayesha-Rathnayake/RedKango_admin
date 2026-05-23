import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reviews.component.html',
})
export class ReviewsComponent implements OnInit {

  reviews: any[] = [];
  filteredReviews: any[] = [];

  searchQuery = '';

  selectedReview: any = null;
  showViewModal = false;
  replyText = '';

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.reviews = [
      {
        id: 1,
        customer: 'Sarah Johnson',
        service: 'Tent Rental',
        rating: 5,
        date: '05/10/2025',
        comment: 'Amazing experience! The tent was in perfect condition and the staff was very helpful.',
        reply: '',
      },
      {
        id: 2,
        customer: 'Grace Taylor',
        service: 'Equipment',
        rating: 4,
        date: '01/10/2025',
        comment: 'Great equipment quality. Delivery was a bit late but overall satisfied.',
        reply: '',
      },
      {
        id: 3,
        customer: 'Mark Jones',
        service: 'Camping Tips',
        rating: 3,
        date: '24/09/2025',
        comment: 'Tips were helpful but could use more detail on safety procedures.',
        reply: 'Thank you for your feedback Mark! We will update our camping tips guide soon.',
      },
      {
        id: 4,
        customer: 'Aria Nelson',
        service: 'Tent Rental',
        rating: 2,
        date: '14/09/2025',
        comment: 'The tent had a small tear on the side. Disappointed with the condition.',
        reply: '',
      },
      {
        id: 5,
        customer: 'James Silva',
        service: 'Equipment',
        rating: 5,
        date: '10/09/2025',
        comment: 'Top notch gear! Will definitely rent again. Highly recommended.',
        reply: '',
      },
    ];

    this.sortAndFilter();
  }

  sortAndFilter() {
    let result = [...this.reviews];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(r =>
        r.customer.toLowerCase().includes(q) ||
        r.service.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const parseDate = (d: string) => {
        const [day, month, year] = d.split('/');
        return new Date(+year, +month - 1, +day).getTime();
      };
      return parseDate(b.date) - parseDate(a.date);
    });

    this.filteredReviews = result;
  }

  onSearch() {
    this.sortAndFilter();
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  getRatingLabel(rating: number): string {
    const labels: Record<number, string> = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };
    return labels[rating] || '';
  }

  openViewModal(review: any) {
    this.selectedReview = { ...review };
    this.replyText = review.reply || '';
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedReview = null;
    this.replyText = '';
  }

  saveReply() {
    const index = this.reviews.findIndex(r => r.id === this.selectedReview.id);
    if (index !== -1) {
      this.reviews[index].reply = this.replyText;
    }
    this.sortAndFilter();
    this.closeViewModal();
  }

  deleteReview(id: number) {
    this.reviews = this.reviews.filter(r => r.id !== id);
    this.sortAndFilter();
  }

  deleteReply() {
    const index = this.reviews.findIndex(r => r.id === this.selectedReview.id);
    if (index !== -1) {
      this.reviews[index].reply = '';
      this.selectedReview.reply = '';
    }
    this.replyText = '';
    this.sortAndFilter();
  }
}