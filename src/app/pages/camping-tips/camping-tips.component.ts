import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { CampingTipService } from '../../services/camping-tip.service';

@Component({
  selector: 'app-camping-tips',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, QuillModule],
  templateUrl: './camping-tips.component.html',
})
export class CampingTipsComponent implements OnInit {
  tips: any[] = [];
  showModal = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';

  imagePreviewUrl = '';
  videoPreviewUrl = '';
  deleteModalOpen = false;
  tipToDelete: number | null = null;

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

  newTip: any = this.emptyTip();

  constructor(
    private campingTipService: CampingTipService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadTips();
  }

  private emptyTip() {
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
    };
  }

  loadTips() {
    this.campingTipService.getAll().subscribe({
      next: (data) => {
        this.tips = data.map((tip: any) => ({
          ...tip,
          status: tip.published ? 'Published' : 'Draft',
        }));

        this.sortTips();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load camping tips', err);
        this.showError('Failed to load articles. Check your login session.');
      },
    });
  }

  sortTips() {
    this.tips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  isExpanded(id: number) {
    return this.expandedTips.has(id);
  }

  toggleExpand(id: number) {
    this.expandedTips.has(id) ? this.expandedTips.delete(id) : this.expandedTips.add(id);
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

  onMediaTypeChange() {
    this.imagePreviewUrl = '';
    this.videoPreviewUrl = '';
    this.newTip.imageUrl = '';
    this.newTip.mediaUrl = '';
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.campingTipService.uploadFile(file).subscribe({
      next: (res) => {
        this.imagePreviewUrl = res.url;
        this.newTip.imageUrl = res.url;
      },
      error: (err) => {
        console.error(err);
        this.showError('Image upload failed.');
      },
    });
  }

  onVideoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.campingTipService.uploadFile(file).subscribe({
      next: (res) => {
        this.videoPreviewUrl = res.url;
        this.newTip.mediaUrl = res.url;
      },
      error: (err) => {
        console.error(err);
        this.showError('Video upload failed.');
      },
    });
  }

  removeImage() {
    this.imagePreviewUrl = '';
    this.newTip.imageUrl = '';
  }

  removeVideo() {
    this.videoPreviewUrl = '';
    this.newTip.mediaUrl = '';
  }

  openAddModal() {
    this.isEditing = false;
    this.imagePreviewUrl = '';
    this.videoPreviewUrl = '';
    this.newTip = this.emptyTip();
    this.showModal = true;
  }

  openEditModal(tip: any) {
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

  saveTip() {
    const plainText = this.getPlainText(this.newTip.content);

    const payload = {
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
      error: (err) => {
        console.error(err);
        const msg = err?.error?.message || err?.message || 'Something went wrong.';
        this.showError(msg);
      },
    });
  }

  openDeleteModal(id: number) {
    this.tipToDelete = id;
    this.deleteModalOpen = true;
  }

  closeDeleteModal() {
    this.deleteModalOpen = false;
    this.tipToDelete = null;
  }

  confirmDelete() {
    if (this.tipToDelete === null) return;

    const id = this.tipToDelete;

    this.campingTipService.delete(id).subscribe({
      next: () => {
        this.tips = this.tips.filter((t) => t.id !== id);
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

  closeModal() {
    this.showModal = false;
    this.newTip = this.emptyTip();
    this.imagePreviewUrl = '';
    this.videoPreviewUrl = '';
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    this.successMessage = '';
    setTimeout(() => (this.errorMessage = ''), 4000);
  }

  private showSuccess(msg: string) {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => (this.successMessage = ''), 3000);
  }
}
