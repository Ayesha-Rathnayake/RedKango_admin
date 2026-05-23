// // src/app/services/camping-tip.service.ts
// import { HttpClient } from "@angular/common/http";
// import { Injectable } from "@angular/core";

// @Injectable({ providedIn: 'root' })
// export class CampingTipService {

//   private api = 'http://localhost:8080/api/admin/camping-tips'; 

//   constructor(private http: HttpClient) {}

//   getAll() {
//     return this.http.get<any[]>(this.api);  
//   }

//   create(tip: any) {
//     return this.http.post<any>(this.api, tip);
//   }

//   update(id: number, tip: any) {
//     return this.http.put<any>(`${this.api}/${id}`, tip);
//   }

//   delete(id: number) {
//     return this.http.delete<void>(`${this.api}/${id}`);
//   }

//   togglePublished(id: number) {
//     return this.http.patch<any>(`${this.api}/${id}/toggle-published`, {});
//   }
//   uploadFile(file: File) {
//   const formData = new FormData();
//   formData.append('file', file);

//   return this.http.post<{ url: string }>(
//     'http://localhost:8080/api/admin/upload',
//     formData
//   );
// }
// }

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CampingTipService {
  private api = 'http://localhost:8080/api/admin/camping-tips';
  private uploadApi = 'http://localhost:8080/api/admin/upload';

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<any[]>(this.api);
  }

  create(tip: any) {
    return this.http.post<any>(this.api, tip);
  }

  update(id: number, tip: any) {
    return this.http.put<any>(`${this.api}/${id}`, tip);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  togglePublished(id: number) {
    return this.http.patch<any>(`${this.api}/${id}/toggle-published`, {});
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(this.uploadApi, formData);
  }
}