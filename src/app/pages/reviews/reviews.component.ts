import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminService } from '../../services/admin.service';
import { Review } from '../../models/review.model';

interface AdminReviewViewModel {
  id: number;
  customer: string;
  service: string;
  targetType?: string | null;
  rating: number;
  date: string;
  rawDate: string;
  comment: string;
  reply: string;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reviews.component.html',
  providers: [DatePipe],
})
export class ReviewsComponent implements OnInit {
  reviews: AdminReviewViewModel[] = [];
  filteredReviews: AdminReviewViewModel[] = [];

  searchQuery = '';
  currentPage = 1;
  itemsPerPage = 5;

  selectedReview: AdminReviewViewModel | null = null;
  showViewModal = false;
  replyText = '';

  loading = false;
  savingReply = false;

  showDeleteModal = false;
  reviewToDelete: AdminReviewViewModel | null = null;

  successMessage = '';
  errorMessage = '';
  modalSuccessMessage = '';
  modalErrorMessage = '';

  constructor(
    private adminService: AdminService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;

    this.adminService.getReviews().subscribe({
      next: (res: Review[]) => {
        this.reviews = res.map((review) => this.mapReview(review));
        this.sortAndFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to load reviews', err);
        this.errorMessage = 'Failed to load reviews.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  mapReview(review: Review): AdminReviewViewModel {
    return {
      id: review.id,
      customer: review.name || 'Customer',
      service: review.service || review.productName || 'Review',
      targetType: review.targetType,
      rating: review.rating,
      date: this.datePipe.transform(review.createdAt, 'dd/MM/yyyy') || '',
      rawDate: review.createdAt,
      comment: review.review,
      reply: review.reply || '',
    };
  }

  sortAndFilter(): void {
    let result = [...this.reviews];

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();

      result = result.filter(
        (review) =>
          review.customer.toLowerCase().includes(query) ||
          review.service.toLowerCase().includes(query) ||
          review.comment.toLowerCase().includes(query)
      );
    }

    result.sort(
      (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
    );

    this.filteredReviews = result;
    this.currentPage = 1;
  }

  onSearch(): void {
    this.sortAndFilter();

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
  }

  get paginatedReviews(): AdminReviewViewModel[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredReviews.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReviews.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, index) => (index < rating ? 1 : 0));
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

  openViewModal(review: AdminReviewViewModel): void {
    this.selectedReview = { ...review };
    this.replyText = review.reply || '';
    this.showViewModal = true;
    this.modalSuccessMessage = '';
    this.modalErrorMessage = '';
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedReview = null;
    this.replyText = '';
    this.modalSuccessMessage = '';
    this.modalErrorMessage = '';
  }

  saveReply(): void {
    if (!this.selectedReview || !this.replyText.trim()) return;

    this.savingReply = true;
    this.modalSuccessMessage = '';
    this.modalErrorMessage = '';

    this.adminService.saveReviewReply(this.selectedReview.id, this.replyText.trim()).subscribe({
      next: (updatedReview: Review) => {
        const mapped = this.mapReview(updatedReview);

        this.reviews = this.reviews.map((review) =>
          review.id === mapped.id ? mapped : review
        );

        this.sortAndFilter();
        this.selectedReview = mapped;
        this.replyText = mapped.reply;
        this.savingReply = false;
        this.modalSuccessMessage = 'Reply saved successfully.';

        this.cdr.detectChanges();

        setTimeout(() => {
          this.closeViewModal();
          this.successMessage = 'Reply saved successfully.';
          this.cdr.detectChanges();

          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 3000);
        }, 1000);
      },
      error: (err: unknown) => {
        console.error('Failed to save reply', err);
        this.savingReply = false;

        this.modalErrorMessage =
          err instanceof HttpErrorResponse
            ? err.error?.message || 'Failed to save reply. Please try again.'
            : 'Failed to save reply. Please try again.';

        this.cdr.detectChanges();
      },
    });
  }

  openDeleteModal(review: AdminReviewViewModel): void {
    this.reviewToDelete = review;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.reviewToDelete = null;
  }

  confirmDelete(): void {
    if (!this.reviewToDelete) return;

    const deleteId = this.reviewToDelete.id;

    this.adminService.deleteReview(deleteId).subscribe({
      next: () => {
        this.reviews = this.reviews.filter((review) => review.id !== deleteId);
        this.sortAndFilter();
        this.successMessage = 'Review deleted successfully.';
        this.closeDeleteModal();
        this.cdr.detectChanges();

        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err: unknown) => {
        console.error('Failed to delete review', err);
        this.errorMessage = 'Failed to delete review.';
        this.closeDeleteModal();
        this.cdr.detectChanges();

        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
    });
  }

  deleteReply(): void {
    if (!this.selectedReview) return;

    this.modalSuccessMessage = '';
    this.modalErrorMessage = '';

    this.adminService.deleteReviewReply(this.selectedReview.id).subscribe({
      next: (updatedReview: Review) => {
        const mapped = this.mapReview(updatedReview);

        this.reviews = this.reviews.map((review) =>
          review.id === mapped.id ? mapped : review
        );

        this.selectedReview = mapped;
        this.replyText = '';
        this.sortAndFilter();
        this.modalSuccessMessage = 'Reply removed successfully.';
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to delete reply', err);
        this.modalErrorMessage = 'Failed to delete reply.';
        this.cdr.detectChanges();
      },
    });
  }
}