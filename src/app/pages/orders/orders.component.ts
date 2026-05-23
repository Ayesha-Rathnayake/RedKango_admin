import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {

  orders: any[] = [];
  showModal = false;
  isEditing = false;

  newOrder: any = {
    orderId: '',
    customer: '',
    product: '',
    quantity: 1,
    unitPrice: 0,
    status: 'Pending',
  };

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orders = [
      { orderId: 'OR001', customer: 'Sarah Johnson', product: 'Sleeping Bag',          quantity: 2, unitPrice: 6500,  status: 'Delivered'  },
      { orderId: 'OR002', customer: 'Grace Taylor',  product: 'Camping Backpack',       quantity: 1, unitPrice: 9800,  status: 'Pending'    },
      { orderId: 'OR003', customer: 'Mark Jones',    product: 'Camping Stove',          quantity: 3, unitPrice: 3400,  status: 'Processing' },
      { orderId: 'OR004', customer: 'Aria Nelson',   product: 'Camping Cookware Set',   quantity: 1, unitPrice: 11500, status: 'Pending'    },
      { orderId: 'OR005', customer: 'James Silva',   product: 'Sleeping Bag',           quantity: 4, unitPrice: 6500,  status: 'Cancelled'  },
    ];
  }

  openAddModal() {
    this.isEditing = false;
    this.newOrder = {
      orderId: '',
      customer: '',
      product: '',
      quantity: 1,
      unitPrice: 0,
      status: 'Pending',
    };
    this.showModal = true;
  }

  openEditModal(order: any) {
    this.isEditing = true;
    this.newOrder = { ...order };
    this.showModal = true;
  }

  saveOrder() {
    if (this.isEditing) {
      const index = this.orders.findIndex(o => o.orderId === this.newOrder.orderId);
      if (index !== -1) this.orders[index] = { ...this.newOrder };
    } else {
      this.orders.push({ ...this.newOrder });
    }
    this.showModal = false;
  }

  deleteOrder(orderId: string) {
    this.orders = this.orders.filter(o => o.orderId !== orderId);
  }

  closeModal() {
    this.showModal = false;
  }
}