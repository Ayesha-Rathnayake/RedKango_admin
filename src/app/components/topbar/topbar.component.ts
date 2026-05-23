import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();

  constructor(
    private router: Router,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

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

  passwordMessage = '';
  passwordMessageType: 'success' | 'error' | '' = '';

  selectedFile: File | null = null;
  previewUrl = '';

  notifications = [
    { id: 1, message: 'New booking received', time: '2 min ago', read: false },
    { id: 2, message: 'Payment confirmed', time: '15 min ago', read: false },
    { id: 3, message: 'New review submitted', time: '1 hour ago', read: false },
  ];

  admin = {
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    role: 'Admin',
    avatarUrl: '',
    avatarInitial: '',
  };

  editAdmin = { ...this.admin };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  ngOnInit() {
    setTimeout(() => {
      this.loadAdminProfile();
    });
  }

  get unreadCount() {
    return this.notifications.filter((n) => !n.read).length;
  }

  private mapAdminProfile(res: any) {
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

  loadAdminProfile() {
    this.loadingProfile = true;

    this.adminService.getAdminProfile().subscribe({
      next: (res) => {
        this.admin = this.mapAdminProfile(res);
        this.editAdmin = { ...this.admin };
        this.loadingProfile = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
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

  onMenuToggle() {
    this.menuToggle.emit();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  markAsRead(id: number) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) notification.read = true;
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
  }

  clearNotification(id: number) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  openProfileModal() {
    this.showProfileMenu = false;
    this.showNotifications = false;
    this.showProfileModal = true;

    this.editAdmin = { ...this.admin };
    this.previewUrl = this.admin.avatarUrl;
    this.selectedFile = null;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  openPasswordModal() {
    this.showProfileMenu = false;
    this.showPasswordModal = true;

    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    this.passwordMessage = '';
    this.passwordMessageType = '';
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  closePasswordModal() {
    this.showPasswordModal = false;
    this.passwordMessage = '';
    this.passwordMessageType = '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB.');
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeProfileImage() {
    this.previewUrl = '';
    this.selectedFile = null;
    this.editAdmin.avatarUrl = '';
  }

  saveProfile() {
    if (!this.editAdmin.name.trim()) {
      alert('Name is required.');
      return;
    }

    if (!this.editAdmin.phone.trim()) {
      alert('Phone number is required.');
      return;
    }

    this.savingProfile = true;

    const saveToBackend = (profileImageUrl: string) => {
      const nameParts = this.editAdmin.name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const payload = {
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
          this.showProfileModal = false;
          this.savingProfile = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to update profile:', err);
          alert(err?.error?.message || 'Profile update failed.');
          this.savingProfile = false;
        },
      });
    };

    if (this.selectedFile) {
      this.adminService.uploadFile(this.selectedFile).subscribe({
        next: (res) => {
          saveToBackend(res.url);
        },
        error: (err) => {
          console.error('Image upload failed:', err);
          alert('Image upload failed.');
          this.savingProfile = false;
        },
      });
    } else {
      saveToBackend(this.previewUrl || '');
    }
  }

  updatePassword() {
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
      next: (res: any) => {
        this.passwordMessage = res?.message || 'Password changed successfully.';
        this.passwordMessageType = 'success';
        this.changingPassword = false;

        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        };

        this.showCurrentPassword = false;
        this.showNewPassword = false;
        this.showConfirmPassword = false;
      },
      error: (err) => {
        console.error('Password change failed:', err);
        this.passwordMessage = err?.error?.message || 'Password change failed. Please try again.';
        this.passwordMessageType = 'error';
        this.changingPassword = false;
      },
    });
  }

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    this.router.navigate(['/login']);
  }
}