import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) {}

  getAdminProfile() {
    return this.http.get<any>(`${this.api}/profile`);
  }

  updateAdminProfile(data: any) {
    return this.http.put<any>(`${this.api}/profile`, data);
  }

  changePassword(data: any) {
    return this.http.put<any>(`${this.api}/change-password`, data);
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.api}/upload`, formData);
  }

  getDashboardStats() {
    return this.http.get(`${this.api}/stats`);
  }
  getRecentBookings() {
    return this.http.get(`${this.api}/bookings/recent`);
  }
  getBookings() {
    return this.http.get(`${this.api}/bookings`);
  }
  updateBooking(id: string, data: any) {
    return this.http.put(`${this.api}/bookings/${id}`, data);
  }
  deleteBooking(id: string) {
    return this.http.delete(`${this.api}/bookings/${id}`);
  }

  getProducts() {
    return this.http.get(`${this.api}/products`);
  }
  addProduct(data: any) {
    return this.http.post(`${this.api}/products`, data);
  }
  updateProduct(id: string, data: any) {
    return this.http.put(`${this.api}/products/${id}`, data);
  }
  deleteProduct(id: string) {
    return this.http.delete(`${this.api}/products/${id}`);
  }

  getOrders() {
    return this.http.get(`${this.api}/orders`);
  }

  getReviews() {
    return this.http.get(`${this.api}/reviews`);
  }
  deleteReview(id: string) {
    return this.http.delete(`${this.api}/reviews/${id}`);
  }

  getCampingTips() {
    return this.http.get(`${this.api}/tips`);
  }
  addCampingTip(data: any) {
    return this.http.post(`${this.api}/tips`, data);
  }
  updateCampingTip(id: string, data: any) {
    return this.http.put(`${this.api}/tips/${id}`, data);
  }
  deleteCampingTip(id: string) {
    return this.http.delete(`${this.api}/tips/${id}`);
  }

getUsers() {
  return this.http.get(`${this.api}/users`);
}

updateUserStatus(id: number, enabled: boolean) {
  return this.http.patch(`${this.api}/users/${id}/status`, { enabled });
}

deleteUser(id: number) {
  return this.http.delete(`${this.api}/users/${id}`);
}
}
