import { Component, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AdminService } from '../../services/admin.service';
import { NotificationService } from '../../services/notification.service';
import { AdminNotification } from '../../models/notification.model';
import {
  AdminProfile,
  AdminViewModel,
  UpdateAdminProfileRequest,
} from '../../models/admin-profile.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Output() menuToggle = new EventEmitter<void>();

  showNotifications = false;
  showProfileMenu = false;
  showProfileModal = false;
  showPasswordModal = false;

  loadingProfile = true;
  savingProfile = false;
  changingPassword = false;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  profileMessage = '';
  profileMessageType: 'success' | 'error' | '' = '';

  passwordMessage = '';
  passwordMessageType: 'success' | 'error' | '' = '';

  selectedFile: File | null = null;
  previewUrl = '';

  notifications: AdminNotification[] = [];
  private notificationSub?: Subscription;

  admin: AdminViewModel = {
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    role: 'Admin',
    avatarUrl: '',
    avatarInitial: '',
  };

  editAdmin: AdminViewModel = { ...this.admin };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  constructor(
    private router: Router,
    private adminService: AdminService,
    public notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAdminProfile();
    this.notificationService.init();
    this.notificationSub = this.notificationService.getNotifications().subscribe(n => {
      this.notifications = n;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.notificationSub?.unsubscribe();
    this.notificationService.disconnect();
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  private mapAdminProfile(res: AdminProfile): AdminViewModel {
    const firstName = res.firstName || '';
    const lastName = res.lastName === '-' ? '' : res.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || res.fullName || 'Admin';

    return {
      firstName,
      lastName,
      name: fullName,
      email: res.email || '',
      phone: res.phone || '',
      role: res.role || 'Admin',
      avatarUrl: res.profileImageUrl || '',
      avatarInitial: fullName.charAt(0).toUpperCase() || 'A',
    };
  }

  loadAdminProfile(): void {
    this.loadingProfile = true;

    this.adminService.getAdminProfile().subscribe({
      next: (res) => {
        this.admin = this.mapAdminProfile(res);
        this.editAdmin = { ...this.admin };
        this.loadingProfile = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to load admin profile:', err);
        this.admin = {
          firstName: '',
          lastName: '',
          name: 'Admin',
          email: '',
          phone: '',
          role: 'Admin',
          avatarUrl: '',
          avatarInitial: 'A',
        };
        this.editAdmin = { ...this.admin };
        this.loadingProfile = false;
        this.cdr.detectChanges();
      },
    });
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  clearNotification(id: number): void {
    this.notificationService.remove(id);
  }

  openProfileModal(): void {
    this.showProfileMenu = false;
    this.showNotifications = false;
    this.showProfileModal = true;
    this.editAdmin = { ...this.admin };
    this.previewUrl = this.admin.avatarUrl;
    this.selectedFile = null;
    this.profileMessage = '';
    this.profileMessageType = '';
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.profileMessage = '';
    this.profileMessageType = '';
  }

  openPasswordModal(): void {
    this.showProfileMenu = false;
    this.showNotifications = false;
    this.showPasswordModal = true;
    this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.passwordMessage = '';
    this.passwordMessageType = '';
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordMessage = '';
    this.passwordMessageType = '';
    this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.profileMessage = '';
    this.profileMessageType = '';

    if (!file.type.startsWith('image/')) {
      this.profileMessage = 'Please select a valid image file.';
      this.profileMessageType = 'error';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.profileMessage = 'Image size should be less than 2MB.';
      this.profileMessageType = 'error';
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeProfileImage(): void {
    this.previewUrl = '';
    this.selectedFile = null;
    this.editAdmin.avatarUrl = '';
    this.profileMessage = 'Profile photo removed. Click Save Changes to apply this update.';
    this.profileMessageType = 'success';
  }

  saveProfile(): void {
    this.profileMessage = '';
    this.profileMessageType = '';

    if (!this.editAdmin.name.trim()) {
      this.profileMessage = 'Name is required.';
      this.profileMessageType = 'error';
      return;
    }

    if (!this.editAdmin.phone.trim()) {
      this.profileMessage = 'Phone number is required.';
      this.profileMessageType = 'error';
      return;
    }

    this.savingProfile = true;

    const saveToBackend = (profileImageUrl: string): void => {
      const nameParts = this.editAdmin.name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const payload: UpdateAdminProfileRequest = {
        firstName,
        lastName,
        phone: this.editAdmin.phone.trim(),
        profileImageUrl,
      };

      this.adminService.updateAdminProfile(payload).subscribe({
        next: (res) => {
          this.admin = this.mapAdminProfile(res);
          this.editAdmin = { ...this.admin };
          this.previewUrl = this.admin.avatarUrl;
          this.profileMessage = 'Your profile has been updated successfully.';
          this.profileMessageType = 'success';
          this.savingProfile = false;
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('Failed to update profile:', err);
          this.profileMessage = 'Profile update failed. Please try again.';
          this.profileMessageType = 'error';
          this.savingProfile = false;
          this.cdr.detectChanges();
        },
      });
    };

    if (this.selectedFile) {
      this.adminService.uploadFile(this.selectedFile).subscribe({
        next: (res) => saveToBackend(res.url),
        error: (err: unknown) => {
          console.error('Image upload failed:', err);
          this.profileMessage = 'Image upload failed. Please try again.';
          this.profileMessageType = 'error';
          this.savingProfile = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      saveToBackend(this.previewUrl || '');
    }
  }

  updatePassword(): void {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm;
    this.passwordMessage = '';
    this.passwordMessageType = '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.passwordMessage = 'Please fill in all password fields.';
      this.passwordMessageType = 'error';
      return;
    }

    if (newPassword.length < 8) {
      this.passwordMessage = 'New password must be at least 8 characters long.';
      this.passwordMessageType = 'error';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.passwordMessage = 'New password and confirm password do not match.';
      this.passwordMessageType = 'error';
      return;
    }

    this.changingPassword = true;

    this.adminService.changePassword(this.passwordForm).subscribe({
      next: () => {
        this.passwordMessage = 'Your password has been updated successfully.';
        this.passwordMessageType = 'success';
        this.changingPassword = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.showCurrentPassword = false;
        this.showNewPassword = false;
        this.showConfirmPassword = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Password change failed:', err);
        this.passwordMessage = 'Password change failed. Please try again.';
        this.passwordMessageType = 'error';
        this.changingPassword = false;
        this.cdr.detectChanges();
      },
    });
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refreshToken');
    this.notificationService.disconnect();
    this.router.navigate(['/login']);
  }
}
