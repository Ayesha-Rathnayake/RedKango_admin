export type CampingTipMediaType = 'IMAGE' | 'VIDEO' | 'YOUTUBE';

export interface CampingTip {
  id: number;

  title: string;
  slug?: string;

  summary: string;
  content: string;
  author: string;

  mediaType: CampingTipMediaType;

  imageUrl?: string | null;
  mediaUrl?: string | null;

  readTime: string;
  published: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface CampingTipRequest {
  title: string;
  summary: string;
  content: string;
  author: string;

  mediaType: CampingTipMediaType;

  imageUrl?: string | null;
  mediaUrl?: string | null;

  readTime: string;
  published: boolean;
}

export interface FileUploadResponse {
  url: string;
}