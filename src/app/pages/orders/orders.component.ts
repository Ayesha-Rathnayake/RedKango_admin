import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AdminService } from '../../services/admin.service';
import { Order, DispatchOrderRequest } from '../../models/order.model';

type OrderFilter =
  | 'ALL'
  | 'PENDING_PAYMENT'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];

  selectedOrder?: Order;

  loading = false;
  dispatching = false;

  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  statusFilter: OrderFilter = 'ALL';
  sortOrder: 'newest' | 'oldest' = 'newest';
  
  showDispatchModal = false;
  dispatchOrderData?: Order;

  dispatchForm: DispatchOrderRequest = {
    courierName: '',
    trackingNumber: '',
  };

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loadOrders();
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.errorMessage = err.error?.message || 'Failed to load orders.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

applyFilters(): void {
  let result = [...this.orders];

  if (this.statusFilter !== 'ALL') {
    result = result.filter((order) => order.orderStatus === this.statusFilter);
  }

  if (this.searchTerm.trim()) {
    const query = this.searchTerm.toLowerCase();
    result = result.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query),
    );
  }

  result.sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return this.sortOrder === 'newest' ? diff : -diff;
  });

  this.filteredOrders = result;
  this.currentPage = 1;
}



  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.sortOrder = 'newest';
    this.applyFilters();
  }


  currentPage = 1;
itemsPerPage = 5;

get paginatedOrders(): Order[] {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  return this.filteredOrders.slice(start, start + this.itemsPerPage);
}

get totalPages(): number {
  return Math.ceil(this.filteredOrders.length / this.itemsPerPage) || 1;
}

changePage(page: number): void {
  if (page < 1 || page > this.totalPages) return;
  this.currentPage = page;
}

get pageNumbers(): (number | '...')[] {
  const pages: (number | '...')[] = [];
  const total = this.totalPages;
  const current = this.currentPage;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}


  openViewModal(order: Order): void {
    this.selectedOrder = order;
  }

  closeViewModal(): void {
    this.selectedOrder = undefined;
  }

  openDispatchModal(order: Order): void {
    this.dispatchOrderData = order;
    this.dispatchForm = {
      courierName: order.courierName || '',
      trackingNumber: order.trackingNumber || '',
    };
    this.showDispatchModal = true;
  }

  closeDispatchModal(): void {
    this.showDispatchModal = false;
    this.dispatchOrderData = undefined;
    this.dispatchForm = {
      courierName: '',
      trackingNumber: '',
    };
  }

  submitDispatch(): void {
    if (!this.dispatchOrderData) return;

    if (!this.dispatchForm.courierName.trim()) {
      this.errorMessage = 'Courier service is required.';
      return;
    }

    if (!this.dispatchForm.trackingNumber.trim()) {
      this.errorMessage = 'Tracking number is required.';
      return;
    }

    this.dispatching = true;
    this.errorMessage = '';

    this.adminService.dispatchOrder(this.dispatchOrderData.orderId, this.dispatchForm).subscribe({
      next: (updatedOrder) => {
        this.orders = this.orders.map((order) =>
          order.orderId === updatedOrder.orderId ? updatedOrder : order,
        );

        this.applyFilters();

        if (this.selectedOrder?.orderId === updatedOrder.orderId) {
          this.selectedOrder = updatedOrder;
        }

        this.successMessage = `Order ${updatedOrder.orderNumber} dispatched successfully. Tracking email sent to customer.`;

        this.dispatching = false;
        this.closeDispatchModal();

        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3500);

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to dispatch order', err);
        this.errorMessage = err.error?.message || 'Failed to dispatch order.';
        this.dispatching = false;
        this.cdr.detectChanges();
      },
    });
  }

  canDispatch(order: Order): boolean {
    return order.orderStatus === 'PROCESSING' && order.paymentStatus === 'PAID';
  }

  getCustomerInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getItemsText(order: Order): string {
    if (!order.items || order.items.length === 0) return '-';

    if (order.items.length === 1) {
      return order.items[0].productName;
    }

    return `${order.items[0].productName} + ${order.items.length - 1} more`;
  }

  getTotalQuantity(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  formatStatus(status: string): string {
    return status
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING_PAYMENT':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-700';
      case 'DISPATCHED':
        return 'bg-purple-100 text-purple-700';
      case 'DELIVERED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }
}
