export type ReviewTargetType = 'PRODUCT' | 'SERVICE';

export interface Review {
  id: number;
  name: string;
  email?: string | null;
  targetType?: ReviewTargetType | null;
  productName?: string | null;
  service?: string | null;
  rating: number;
  review: string;
  approved?: boolean;
  reply?: string | null;
  createdAt: string;
}