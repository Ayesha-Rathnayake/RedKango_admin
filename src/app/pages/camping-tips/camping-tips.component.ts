import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { CampingTipService } from '../../services/camping-tip.service';
import {
  CampingTip,
  CampingTipRequest,
  CampingTipMediaType,
} from '../../models/camping-tip.model';

interface CampingTipViewModel extends CampingTip {
  status: 'Published' | 'Draft';
}

@Component({
  selector: 'app-camping-tips',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, QuillModule],
  templateUrl: './camping-tips.component.html',
})
export class CampingTipsComponent implements OnInit {
  tips: CampingTipViewModel[] = [];
  showModal = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';

  imagePreviewUrl = '';
  videoPreviewUrl = '';
  deleteModalOpen = false;
  tipToDelete: number | null = null;

  currentPage = 1;
  itemsPerPage = 5;

  expandedTips = new Set<number>();

  quillModules = {
    toolbar: {
      container: [
        [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean'],
      ],
    },
  };

  newTip: CampingTipViewModel = this.emptyTip();

  constructor(
    private campingTipService: CampingTipService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadTips();
  }

  private emptyTip(): CampingTipViewModel {
    return {
      id: 0,
      title: '',
      summary: '',
      content: '',
      author: 'Admin',
      status: 'Published',
      mediaType: 'IMAGE',
      imageUrl: '',
      mediaUrl: '',
      readTime: '5 min read',
      published: true,
    };
  }

  private toViewModel(tip: CampingTip): CampingTipViewModel {
    return {
      ...tip,
      status: tip.published ? 'Published' : 'Draft',
    };
  }

  loadTips(): void {
    this.campingTipService.getAll().subscribe({
      next: (data: CampingTip[]) => {
        this.tips = data.map((tip) => this.toViewModel(tip));
        this.sortTips();
        this.currentPage = 1;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to load camping tips', err);
        this.showError('Failed to load articles. Check your login session.');
      },
    });
  }

  sortTips(): void {
    this.tips.sort(
      (a, b) =>
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime(),
    );
  }

  isExpanded(id: number): boolean {
    return this.expandedTips.has(id);
  }

  toggleExpand(id: number): void {
    this.expandedTips.has(id)
      ? this.expandedTips.delete(id)
      : this.expandedTips.add(id);
  }

  getPlainText(html: string): string {
    if (!html) return '';

    const div = document.createElement('div');
    div.innerHTML = html;

    return div.textContent || div.innerText || '';
  }

  needsExpansion(content: string): boolean {
    return this.getPlainText(content).length > 150;
  }

  onMediaTypeChange(): void {
    this.imagePreviewUrl = '';
    this.videoPreviewUrl = '';
    this.newTip.imageUrl = '';
    this.newTip.mediaUrl = '';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.campingTipService.uploadFile(file).subscribe({
      next: (res) => {
        this.imagePreviewUrl = res.url;
        this.newTip.imageUrl = res.url;
      },
      error: (err: unknown) => {
        console.error(err);
        this.showError('Image upload failed.');
      },
    });
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.campingTipService.uploadFile(file).subscribe({
      next: (res) => {
        this.videoPreviewUrl = res.url;
        this.newTip.mediaUrl = res.url;
      },
      error: (err: unknown) => {
        console.error(err);
        this.showError('Video upload failed.');
      },
    });
  }

  removeImage(): void {
    this.imagePreviewUrl = '';
    this.newTip.imageUrl = '';
  }

  removeVideo(): void {
    this.videoPreviewUrl = '';
    this.newTip.mediaUrl = '';
  }

  openAddModal(): void {
    this.isEditing = false;
    this.imagePreviewUrl = '';
    this.videoPreviewUrl = '';
    this.newTip = this.emptyTip();
    this.showModal = true;
  }

  openEditModal(tip: CampingTipViewModel): void {
    this.isEditing = true;

    this.newTip = {
      ...tip,
      status: tip.published ? 'Published' : 'Draft',
      mediaType: tip.mediaType || 'IMAGE',
    };

    this.imagePreviewUrl = tip.imageUrl || '';
    this.videoPreviewUrl = tip.mediaType === 'VIDEO' ? tip.mediaUrl || '' : '';

    this.showModal = true;
  }

  saveTip(): void {
    const plainText = this.getPlainText(this.newTip.content);

    const payload: CampingTipRequest = {
      title: this.newTip.title,
      summary: this.newTip.summary || plainText.slice(0, 200) || this.newTip.title,
      content: this.newTip.content,
      author: this.newTip.author || 'Admin',
mediaType: this.newTip.mediaType,
      imageUrl: this.newTip.mediaType === 'IMAGE' ? this.newTip.imageUrl || null : null,
      mediaUrl:
        this.newTip.mediaType === 'VIDEO' || this.newTip.mediaType === 'YOUTUBE'
          ? this.newTip.mediaUrl || null
          : null,
      readTime: this.newTip.readTime || '5 min read',
      published: this.newTip.status === 'Published',
    };

    const call = this.isEditing
      ? this.campingTipService.update(this.newTip.id, payload)
      : this.campingTipService.create(payload);

    call.subscribe({
      next: () => {
        this.loadTips();
        this.closeModal();
        this.showSuccess(this.isEditing ? 'Article updated.' : 'Article created.');
      },
      error: (err: unknown) => {
        console.error(err);
        this.showError('Something went wrong.');
      },
    });
  }

  openDeleteModal(id: number): void {
    this.tipToDelete = id;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.tipToDelete = null;
  }

  confirmDelete(): void {
    if (this.tipToDelete === null) return;

    const id = this.tipToDelete;

    this.campingTipService.delete(id).subscribe({
      next: () => {
        this.tips = this.tips.filter((t) => t.id !== id);

        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages || 1;
        }

        this.expandedTips.delete(id);
        this.closeDeleteModal();
        this.showSuccess('Article deleted.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.showError('Failed to delete article.');
      },
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.newTip = this.emptyTip();
    this.imagePreviewUrl = '';
    this.videoPreviewUrl = '';
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
    setTimeout(() => (this.errorMessage = ''), 4000);
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  get paginatedTips(): CampingTipViewModel[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.tips.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.tips.length / this.itemsPerPage);
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

}