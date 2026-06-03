import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Product,
  ProductRequest,
} from '../models/product.model';

import { Booking,  DispatchRentalRequest, } from '../models/booking.model';

import { Review } from '../models/review.model';

import { DispatchOrderRequest, Order } from '../models/order.model';

import { TermsCondition } from '../models/terms.model';

import {
  AdminProfile,
  UpdateAdminProfileRequest,
} from '../models/admin-profile.model';

import {
  CampingTip,
  CampingTipRequest,
} from '../models/camping-tip.model';

import { DashboardStats } from '../models/dashboard-stats.model';
import { User } from '../models/user.model';
export interface MessageResponse {
  message: string;
}

export interface UploadResponse {
  url: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private api = 'http://localhost:8080/api/admin';
  private publicApi = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // =========================
  // PROFILE
  // =========================

  getAdminProfile() {
    return this.http.get<AdminProfile>(`${this.api}/profile`);
  }

  updateAdminProfile(data: UpdateAdminProfileRequest) {
    return this.http.put<AdminProfile>(
      `${this.api}/profile`,
      data
    );
  }

  changePassword(data: PasswordChangeRequest) {
    return this.http.put<MessageResponse>(
      `${this.api}/change-password`,
      data
    );
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(
      `${this.api}/upload`,
      formData
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  getDashboardStats() {
    return this.http.get<DashboardStats>(
      `${this.api}/stats`
    );
  }

  // =========================
// BOOKINGS / RENTALS
// =========================

getRecentBookings() {
  return this.http.get<Booking[]>(
    `http://localhost:8080/api/rental-bookings/admin/all`
  );
}

getBookings() {
  return this.http.get<Booking[]>(
    `http://localhost:8080/api/rental-bookings/admin/all`
  );
}

dispatchBooking(id: number, data: DispatchRentalRequest) {
  return this.http.put<Booking>(
    `http://localhost:8080/api/rental-bookings/admin/${id}/dispatch`,
    data
  );
}

markBookingAsRented(id: number) {
  return this.http.put<Booking>(
    `http://localhost:8080/api/rental-bookings/admin/${id}/rented`,
    {}
  );
}

markBookingAsReturned(id: number) {
  return this.http.put<Booking>(
    `http://localhost:8080/api/rental-bookings/admin/${id}/returned`,
    {}
  );
}

completeBooking(id: number) {
  return this.http.put<Booking>(
    `http://localhost:8080/api/rental-bookings/admin/${id}/complete`,
    {}
  );
}

  // =========================
  // PRODUCTS
  // =========================

  getProducts() {
    return this.http.get<Product[]>(
      `${this.api}/products`
    );
  }

  addProduct(data: ProductRequest) {
    return this.http.post<Product>(
      `${this.api}/products`,
      data
    );
  }

  updateProduct(id: number, data: ProductRequest) {
    return this.http.put<Product>(
      `${this.api}/products/${id}`,
      data
    );
  }

  deleteProduct(id: number) {
    return this.http.delete<void>(
      `${this.api}/products/${id}`
    );
  }

  // =========================
  // ORDERS
  // =========================

getOrders() {
  return this.http.get<Order[]>(
    `http://localhost:8080/api/orders/admin/all`
  );
}

dispatchOrder(orderId: number, data: DispatchOrderRequest) {
  return this.http.put<Order>(
    `http://localhost:8080/api/orders/admin/${orderId}/dispatch`,
    data
  );
}
  // =========================
  // CAMPING TIPS
  // =========================

  getCampingTips() {
    return this.http.get<CampingTip[]>(
      `${this.api}/tips`
    );
  }

  addCampingTip(data: CampingTipRequest) {
    return this.http.post<CampingTip>(
      `${this.api}/tips`,
      data
    );
  }

  updateCampingTip(
    id: number,
    data: Partial<CampingTipRequest>
  ) {
    return this.http.put<CampingTip>(
      `${this.api}/tips/${id}`,
      data
    );
  }

  deleteCampingTip(id: number) {
    return this.http.delete<void>(
      `${this.api}/tips/${id}`
    );
  }

  // =========================
  // USERS
  // =========================

getUsers() {
  return this.http.get<User[]>(`${this.api}/users`);
}
  updateUserStatus(
    id: number,
    enabled: boolean
  ) {
    return this.http.patch<MessageResponse>(
      `${this.api}/users/${id}/status`,
      { enabled }
    );
  }

  deleteUser(id: number) {
    return this.http.delete<void>(
      `${this.api}/users/${id}`
    );
  }

  // =========================
  // REVIEWS
  // =========================

  getReviews() {
    return this.http.get<Review[]>(
      `${this.api}/reviews`
    );
  }

  saveReviewReply(
    id: number,
    reply: string
  ) {
    return this.http.put<Review>(
      `${this.api}/reviews/${id}/reply`,
      { reply }
    );
  }

 deleteReviewReply(id: number) {
  return this.http.delete<Review>(
    `${this.api}/reviews/${id}/reply`
  );
}

  deleteReview(id: number) {
    return this.http.delete<void>(
      `${this.api}/reviews/${id}`
    );
  }

  // =========================
  // TERMS & CONDITIONS
  // =========================

  getTerms() {
    return this.http.get<TermsCondition[]>(
      `${this.api}/terms`
    );
  }

  getActiveTerms() {
    return this.http.get<TermsCondition>(
      `${this.publicApi}/terms/active`
    );
  }

  createTerms(
    data: Omit<
      TermsCondition,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) {
    return this.http.post<TermsCondition>(
      `${this.api}/terms`,
      data
    );
  }

  updateTerms(
    id: number,
    data: Partial<TermsCondition>
  ) {
    return this.http.put<TermsCondition>(
      `${this.api}/terms/${id}`,
      data
    );
  }

  deleteTerms(id: number) {
    return this.http.delete<void>(
      `${this.api}/terms/${id}`
    );
  }
}