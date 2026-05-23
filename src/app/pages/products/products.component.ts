import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {

  products: any[] = [];
  showModal = false;
  isEditing = false;
  previewUrl: string = '';

  newProduct: any = {
    productId: '',
    productName: '',
    description: '',
    units: 0,
    price: 0,
    imageUrl: '',
  };

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.products = [
      {
        productId: 'P001',
        productName: 'Sleeping Bag',
        description: 'Lightweight 3-season sleeping bag, rated to 5°C.',
        units: 5,
        price: 6500,
        imageUrl: '',
      },
      {
        productId: 'P002',
        productName: 'Camping Stove',
        description: 'Compact gas stove with wind shield, ideal for trail cooking.',
        units: 8,
        price: 3400,
        imageUrl: '',
      },
      {
        productId: 'P003',
        productName: 'Camping Cookware Set',
        description: 'Non-stick 6-piece cookware set with carry bag.',
        units: 3,
        price: 11500,
        imageUrl: '',
      },
      {
        productId: 'P004',
        productName: 'Camping Backpack',
        description: '60L waterproof hiking backpack with lumbar support.',
        units: 0,
        price: 9800,
        imageUrl: '',
      },
    ];
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  openAddModal() {
    this.isEditing = false;
    this.previewUrl = '';
    this.newProduct = {
      productId: '',
      productName: '',
      description: '',
      units: 0,
      price: 0,
      imageUrl: '',
    };
    this.showModal = true;
  }

  openEditModal(product: any) {
    this.isEditing = true;
    this.newProduct = { ...product };
    this.previewUrl = product.imageUrl || '';
    this.showModal = true;
  }

  saveProduct() {
    this.newProduct.imageUrl = this.previewUrl || this.newProduct.imageUrl;

    if (this.isEditing) {
      const index = this.products.findIndex(p => p.productId === this.newProduct.productId);
      if (index !== -1) this.products[index] = { ...this.newProduct };
    } else {
      this.products.push({ ...this.newProduct });
    }
    this.showModal = false;
  }

  deleteProduct(productId: string) {
    this.products = this.products.filter(p => p.productId !== productId);
  }

  closeModal() {
    this.showModal = false;
  }
}