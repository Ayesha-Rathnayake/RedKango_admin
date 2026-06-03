export type ProductType = 'SALE' | 'RENTAL';

export type StockStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK';

export interface Product {
  id: number;

  productId: string;
  productName: string;
  description: string;

  totalUnits: number;
  availableUnits: number;

  price: number;

  type: ProductType;

  imageUrl: string;

  stockStatus?: StockStatus;
  stockPercentage?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRequest {
  productId: string;
  productName: string;
  description: string;

  totalUnits: number;
  availableUnits: number;

  price: number;

  type: ProductType;

  imageUrl: string;
}

export interface ProductImageUploadResponse {
  imageUrl: string;
}