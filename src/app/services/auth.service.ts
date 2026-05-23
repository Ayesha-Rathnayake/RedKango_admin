import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  email:        string;
  fullName:     string;
  roles:        string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(res => {
          // Only allow ROLE_ADMIN into the admin portal
          if (!res.roles.includes('ROLE_ADMIN')) {
            throw new Error('Access denied');
          }
          localStorage.setItem('admin_token',        res.accessToken);
          localStorage.setItem('admin_refreshToken', res.refreshToken);
          localStorage.setItem('admin_email',        res.email);
          localStorage.setItem('admin_fullName',     res.fullName);
        })
      );
  }

  logout(): void {
    const refreshToken = localStorage.getItem('admin_refreshToken');

    // Tell backend to revoke the refresh token
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe();
    }

    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refreshToken');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_fullName');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('admin_token');
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  getFullName(): string {
    return localStorage.getItem('admin_fullName') ?? 'Admin';
  }

  getEmail(): string {
    return localStorage.getItem('admin_email') ?? '';
  }
}