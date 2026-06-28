import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdminNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = 'http://localhost:8080/api/admin/notifications';

  private notifications$ = new BehaviorSubject<AdminNotification[]>([]);
  private eventSource: EventSource | null = null;

  constructor(
    private http: HttpClient,
    private zone: NgZone
  ) {}

  /**
   * Load existing notifications and subscribe to SSE stream.
   * Call this once when the admin logs in.
   */
  init(): void {
    // Load recent notifications from REST
    this.http.get<AdminNotification[]>(this.api).subscribe({
      next: (data) => this.notifications$.next(data),
      error: () => {}
    });

    // Subscribe to SSE stream
    this.connectSse();
  }

  private connectSse(): void {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    // SSE doesn't support custom headers natively so we pass token as query param
    const url = `${this.api}/stream?token=${encodeURIComponent(token)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('notification', (event: MessageEvent) => {
      this.zone.run(() => {
        try {
          const notification: AdminNotification = JSON.parse(event.data);
          const current = this.notifications$.getValue();
          this.notifications$.next([notification, ...current]);
        } catch (e) {
          console.error('SSE parse error', e);
        }
      });
    });

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      // Reconnect after 5 seconds
      setTimeout(() => this.connectSse(), 5000);
    };
  }

  getNotifications(): Observable<AdminNotification[]> {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): number {
    return this.notifications$.getValue().filter(n => !n.read).length;
  }

  markAsRead(id: number): void {
    this.http.patch(`${this.api}/${id}/read`, {}).subscribe();
    const updated = this.notifications$.getValue().map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notifications$.next(updated);
  }

  markAllAsRead(): void {
    this.http.patch(`${this.api}/read-all`, {}).subscribe();
    const updated = this.notifications$.getValue().map(n => ({ ...n, read: true }));
    this.notifications$.next(updated);
  }

  remove(id: number): void {
    this.http.delete(`${this.api}/${id}`).subscribe();
    const updated = this.notifications$.getValue().filter(n => n.id !== id);
    this.notifications$.next(updated);
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  formatTime(epochMillis: number): string {
    const diff = Date.now() - epochMillis;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  getIcon(type: string): string {
    switch (type) {
      case 'NEW_USER':           return 'fas fa-user-plus text-blue-500';
      case 'NEW_ORDER':          return 'fas fa-shopping-bag text-green-500';
      case 'NEW_BOOKING':        return 'fas fa-calendar-check text-purple-500';
      case 'NEW_REVIEW':         return 'fas fa-star text-yellow-500';
      case 'BOOKING_CANCELLED':  return 'fas fa-calendar-times text-red-500';
      case 'ORDER_CANCELLED':    return 'fas fa-times-circle text-red-500';
      default:                   return 'fas fa-bell text-gray-500';
    }
  }
}
