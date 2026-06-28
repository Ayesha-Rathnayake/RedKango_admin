import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AdminService } from '../../services/admin.service';
import { User, UserStatus, UserViewModel } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './users.component.html',
  providers: [DatePipe],
})
export class UsersComponent implements OnInit {
  users: UserViewModel[] = [];
  filteredUsers: UserViewModel[] = [];

  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 5;

  showModal = false;
  selectedUser: UserViewModel | null = null;

  loading = false;

  showDeleteModal = false;
  userToDelete: UserViewModel | null = null;
  deletingUser = false;
    // Status toggle reason
  showStatusReasonModal = false;
  userToToggle: UserViewModel | null = null;
  statusReason = '';
  statusNotes = '';
  statusReasons = [
    'Suspicious activity under review',
    'Payment dispute in progress',
    'Account verification required',
    'Temporary suspension',
    'Other',
  ];

  // Deactivation reason
  deactivationReason = '';
  deactivationNotes = '';
  deactivationReasons = [
    'Violation of terms and conditions',
    'Fraudulent activity detected',
    'Multiple payment failures',
    'Abusive behaviour reported',
    'Account security concern',
    'Requested by user',
    'Other',
  ];


  successMessage = '';
  errorMessage = '';

  constructor(
    private adminService: AdminService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;

    this.adminService.getUsers().subscribe({
      next: (res: User[]) => {
        this.users = res.map((u) => this.mapUser(u));
        this.filteredUsers = [...this.users];
        this.sortUsers();

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to load users', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  mapUser(u: User): UserViewModel {
    const status: UserStatus = u.status;

    return {
      id: u.id,
      userId: u.userId,
      name: u.name,
      email: u.email,
      phone: u.phone,
      joinDate: this.datePipe.transform(u.joined, 'dd/MM/yyyy'),
      active: status === 'Active',
      locked: u.locked,
      status,
    };
  }

  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredUsers = [...this.users];
      this.currentPage = 1;
      this.sortUsers();
      return;
    }

    this.filteredUsers = this.users.filter((u) => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const userId = (u.userId || '').toLowerCase();
      const status = (u.status || '').toLowerCase();

      return (
        name.includes(term) ||
        email.includes(term) ||
        userId.includes(term) ||
        status.includes(term)
      );
    });

    this.currentPage = 1;
    this.sortUsers();
  }

  sortUsers(): void {
    this.filteredUsers.sort((a, b) => {
      const dateA = this.parseDate(a.joinDate || '');
      const dateB = this.parseDate(b.joinDate || '');
      return dateB - dateA;
    });
  }

  parseDate(date: string): number {
    if (!date) return 0;

    const [day, month, year] = date.split('/');
    return new Date(+year, +month - 1, +day).getTime();
  }

  viewUser(user: UserViewModel): void {
    this.selectedUser = { ...user };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
  }

  toggleStatus(user: UserViewModel): void {
    if (user.status === 'Deactivated') {
      this.errorMessage = 'Deactivated users cannot be modified.';
      setTimeout(() => { this.errorMessage = ''; }, 4000);
      return;
    }

    // If making inactive, show reason modal
    if (user.status === 'Active') {
      this.showDeleteModal = false;
      this.userToDelete = null;
      this.userToToggle = user;
      this.statusReason = '';
      this.statusNotes = '';
      this.showStatusReasonModal = true;
      return;
    }


    // If making active — no reason needed

    this.applyToggleStatus(user, '', '');
  }

  closeStatusReasonModal(): void {
    this.showStatusReasonModal = false;
    this.userToToggle = null;
    this.statusReason = '';
    this.statusNotes = '';
  }

  confirmStatusChange(): void {
    if (!this.userToToggle || !this.statusReason) {
      this.errorMessage = 'Please select a reason.';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
      return;
    }
    // Capture reason and notes BEFORE closing modal (which resets them)
    const user = this.userToToggle;
    const reason = this.statusReason;
    const notes = this.statusNotes;
    this.closeStatusReasonModal();
    this.applyToggleStatus(user, reason, notes);
  }


  private applyToggleStatus(user: UserViewModel, reason: string, notes: string): void {
        console.log('toggleStatus called', user.status, user.active);

  const newActive = !user.active;
  const newStatus = newActive ? 'Active' : 'Inactive';

  const sendReason = !newActive ? (reason || undefined) : undefined;
  const sendNotes = !newActive ? (notes || undefined) : undefined;

  this.adminService.updateUserStatus(user.id, newActive, sendReason, sendNotes).subscribe({
    next: () => {
      this.users = this.users.map((u) =>
        u.id === user.id
          ? { ...u, active: newActive, locked: !newActive, status: newStatus }
          : u
      );
      this.filteredUsers = this.filteredUsers.map((u) =>
        u.id === user.id
          ? { ...u, active: newActive, locked: !newActive, status: newStatus }
          : u
      );
      if (!newActive) {
        this.successMessage = 'User suspended. Notification email sent.';
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 4000);
      } else {
        this.successMessage = 'User activated successfully.';
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      }
      this.cdr.detectChanges();
    },
    error: (err: unknown) => {
      console.error('Failed to update user status', err);
      this.errorMessage = 'Failed to update user status. Please try again.';
      setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 4000);
      this.cdr.detectChanges();
    },
  });
}



  openDeleteModal(user: UserViewModel): void {
    this.showStatusReasonModal = false;
    this.userToToggle = null;
    this.userToDelete = user;
    this.deactivationReason = '';
    this.deactivationNotes = '';
    this.showDeleteModal = true;
    this.successMessage = '';
    this.errorMessage = '';
  }


  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
    this.deactivationReason = '';
    this.deactivationNotes = '';
  }


  confirmDelete(): void {
    if (!this.userToDelete) return;
    if (!this.deactivationReason) {
      this.errorMessage = 'Please select a reason for deactivation.';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
      return;
    }

    const userId = this.userToDelete.id;
    this.deletingUser = true;

    this.adminService.deleteUser(userId, this.deactivationReason, this.deactivationNotes || undefined).subscribe({
      next: () => {
        this.successMessage = 'User account deactivated. Notification email sent.';
        this.users = this.users.map((u) =>
          u.id === userId ? { ...u, active: false, locked: true, status: 'Deactivated' } : u
        );
        this.filteredUsers = this.filteredUsers.map((u) =>
          u.id === userId ? { ...u, active: false, locked: true, status: 'Deactivated' } : u
        );
        this.deletingUser = false;
        this.closeDeleteModal();
        setTimeout(() => { this.successMessage = ''; }, 4000);
      },
      error: (err: unknown) => {
        console.error('Failed to deactivate user', err);
        this.errorMessage = 'Failed to deactivate user. Please try again.';
        this.deletingUser = false;
        setTimeout(() => { this.errorMessage = ''; }, 4000);
      },
    });
  }


  get paginatedUsers(): UserViewModel[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    return this.filteredUsers.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
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


  trackByUserId(index: number, user: UserViewModel): number {
    return user.id;
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter((u) => u.status === 'Active').length;
  }

  get inactiveUsers(): number {
    return this.users.filter((u) => u.status === 'Inactive').length;
  }

  get deactivatedUsers(): number {
    return this.users.filter((u) => u.status === 'Deactivated').length;
  }
}