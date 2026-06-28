import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CampingTip,
  CampingTipRequest,
  FileUploadResponse,
} from '../models/camping-tip.model';

@Injectable({ providedIn: 'root' })
export class CampingTipService {
  private api = 'http://localhost:8080/api/admin/camping-tips';
  private uploadApi = 'http://localhost:8080/api/admin/upload';

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<CampingTip[]>(this.api);
  }

  create(tip: CampingTipRequest) {
    return this.http.post<CampingTip>(this.api, tip);
  }

  update(id: number, tip: CampingTipRequest) {
    return this.http.put<CampingTip>(`${this.api}/${id}`, tip);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  togglePublished(id: number) {
    return this.http.patch<CampingTip>(`${this.api}/${id}/toggle-published`, {});
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<FileUploadResponse>(this.uploadApi, formData);
  }
}