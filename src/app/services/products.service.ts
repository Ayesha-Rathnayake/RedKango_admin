import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Product,
  ProductRequest,
  ProductImageUploadResponse,
} from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private api = 'http://localhost:8080/api/admin/products';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.api);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.api}/${id}`);
  }

  createProduct(data: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.api, data);
  }

  updateProduct(id: number, data: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.api}/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  uploadFile(file: File): Observable<ProductImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ProductImageUploadResponse>(
      `${this.api}/upload-image`,
      formData
    );
  }
}