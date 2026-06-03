import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { Product, ProductRequest } from '../../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];

  showModal = false;
  isEditing = false;
  previewUrl = '';

  showViewModal = false;
  selectedProduct: Product | null = null;

  showDeleteModal = false;
  productToDelete: Product | null = null;

  loading = false;
  saving = false;
  deleting = false;

  successMessage = '';
  errorMessage = '';

  currentPage = 1;
  itemsPerPage = 5;

  searchTerm = '';
  typeFilter: 'ALL' | 'SALE' | 'RENTAL' = 'ALL';
  stockFilter: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'ALL';

  newProduct: ProductRequest & { id?: number } = {
    productId: '',
    productName: '',
    description: '',
    totalUnits: 0,
    availableUnits: 0,
    price: 0,
    type: 'SALE',
    imageUrl: '',
  };

  constructor(
    private productsService: ProductsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.productsService.getProducts().subscribe({
      next: (res) => {
        this.products = res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.errorMessage = 'Failed to load products.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredProducts(): Product[] {
    let result = [...this.products];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      result = result.filter((p) => {
        const productId = (p.productId || '').toLowerCase();
        const productName = (p.productName || '').toLowerCase();
        const description = (p.description || '').toLowerCase();

        return (
          productId.includes(term) ||
          productName.includes(term) ||
          description.includes(term)
        );
      });
    }

    if (this.typeFilter !== 'ALL') {
      result = result.filter((p) => p.type === this.typeFilter);
    }

    if (this.stockFilter !== 'ALL') {
      result = result.filter((p) => p.stockStatus === this.stockFilter);
    }

    return result;
  }

  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = 'ALL';
    this.stockFilter = 'ALL';
    this.currentPage = 1;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      return;
    }

    this.productsService.uploadFile(file).subscribe({
      next: (res) => {
        this.previewUrl = res.imageUrl;
        this.newProduct.imageUrl = res.imageUrl;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Image upload failed', err);
        this.errorMessage = 'Image upload failed. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.previewUrl = '';
    this.errorMessage = '';

    this.newProduct = {
      productId: '',
      productName: '',
      description: '',
      totalUnits: 0,
      availableUnits: 0,
      price: 0,
      type: 'SALE',
      imageUrl: '',
    };

    this.showModal = true;
  }

  openEditModal(product: Product): void {
    this.isEditing = true;
    this.errorMessage = '';

    this.newProduct = {
      id: product.id,
      productId: product.productId,
      productName: product.productName,
      description: product.description || '',
      totalUnits: product.totalUnits,
      availableUnits: product.availableUnits,
      price: product.price,
      type: product.type,
      imageUrl: product.imageUrl || '',
    };

    this.previewUrl = product.imageUrl || '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  saveProduct(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newProduct.productId.trim()) {
      this.errorMessage = 'Product ID is required.';
      return;
    }

    if (!this.newProduct.productName.trim()) {
      this.errorMessage = 'Product name is required.';
      return;
    }

    if (
      this.newProduct.totalUnits < 0 ||
      this.newProduct.availableUnits < 0 ||
      this.newProduct.price < 0
    ) {
      this.errorMessage = 'Total units, available units and price cannot be negative.';
      return;
    }

    if (this.newProduct.availableUnits > this.newProduct.totalUnits) {
      this.errorMessage = 'Available units cannot be greater than total units.';
      return;
    }

    this.saving = true;
    this.newProduct.imageUrl = this.previewUrl || this.newProduct.imageUrl || '';

    const payload: ProductRequest = {
      productId: this.newProduct.productId.trim(),
      productName: this.newProduct.productName.trim(),
      description: this.newProduct.description?.trim() || '',
      totalUnits: Number(this.newProduct.totalUnits),
      availableUnits: Number(this.newProduct.availableUnits),
      price: Number(this.newProduct.price),
      type: this.newProduct.type,
      imageUrl: this.newProduct.imageUrl || '',
    };

    if (this.isEditing && this.newProduct.id) {
      this.productsService.updateProduct(this.newProduct.id, payload).subscribe({
        next: (updated) => {
          this.products = this.products.map((p) =>
            p.id === updated.id ? updated : p
          );

          this.successMessage = 'Product updated successfully.';
          this.saving = false;
          this.showModal = false;
          this.cdr.detectChanges();
          this.clearMessage();
        },
        error: (err) => {
          console.error('Failed to update product', err);
          this.errorMessage = err?.error?.message || 'Failed to update product.';
          this.saving = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.productsService.createProduct(payload).subscribe({
        next: (created) => {
          this.products = [created, ...this.products];
          this.currentPage = 1;

          this.successMessage = 'Product added successfully.';
          this.saving = false;
          this.showModal = false;
          this.cdr.detectChanges();
          this.clearMessage();
        },
        error: (err) => {
          console.error('Failed to create product', err);
          this.errorMessage = err?.error?.message || 'Failed to add product.';
          this.saving = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  openViewModal(product: Product): void {
    this.selectedProduct = product;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.selectedProduct = null;
    this.showViewModal = false;
  }

  openDeleteModal(product: Product): void {
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.productToDelete = null;
    this.showDeleteModal = false;
    this.deleting = false;
  }

  confirmDelete(): void {
    if (!this.productToDelete) return;

    this.deleting = true;

    const id = this.productToDelete.id;
    if (id === undefined || id === null) {
      console.error('Product id is undefined');
      this.deleting = false;
      return;
    }

    this.productsService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(
          (p) => p.id !== this.productToDelete?.id
        );

        this.successMessage = 'Product deleted successfully.';
        this.closeDeleteModal();

        if (this.currentPage > this.totalPages) {
          this.currentPage = Math.max(this.totalPages, 1);
        }

        this.cdr.detectChanges();
        this.clearMessage();
      },
      error: (err) => {
        console.error('Failed to delete product', err);
        this.errorMessage = 'Failed to delete product.';
        this.closeDeleteModal();
        this.cdr.detectChanges();
      },
    });
  }

  clearMessage(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
      this.cdr.detectChanges();
    }, 3500);
  }
}