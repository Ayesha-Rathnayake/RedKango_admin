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
      this.errorMessage = 'Deactivated users cannot be activated from this action.';

      setTimeout(() => {
        this.errorMessage = '';
      }, 4000);

      return;
    }

    const originalActive = user.active;
    const originalLocked = user.locked;
    const originalStatus = user.status;

    user.active = !user.active;
    user.locked = !user.active;
    user.status = user.active ? 'Active' : 'Inactive';

    this.filteredUsers = [...this.filteredUsers];
    this.users = [...this.users];

    this.adminService.updateUserStatus(user.id, user.active).subscribe({
      next: () => {
        this.users = this.users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                active: user.active,
                locked: user.locked,
                status: user.status,
              }
            : u
        );

        this.filteredUsers = this.filteredUsers.map((u) =>
          u.id === user.id
            ? {
                ...u,
                active: user.active,
                locked: user.locked,
                status: user.status,
              }
            : u
        );
      },
      error: (err: unknown) => {
        console.error('Failed to update user status', err);

        user.active = originalActive;
        user.locked = originalLocked;
        user.status = originalStatus;

        this.filteredUsers = [...this.filteredUsers];
        this.users = [...this.users];
      },
    });
  }

  openDeleteModal(user: UserViewModel): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;

    const userId = this.userToDelete.id;

    this.deletingUser = true;

    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.successMessage = 'User account deactivated successfully.';

        this.users = this.users.map((u) =>
          u.id === userId
            ? {
                ...u,
                active: false,
                locked: true,
                status: 'Deactivated',
              }
            : u
        );

        this.filteredUsers = this.filteredUsers.map((u) =>
          u.id === userId
            ? {
                ...u,
                active: false,
                locked: true,
                status: 'Deactivated',
              }
            : u
        );

        this.deletingUser = false;
        this.closeDeleteModal();

        setTimeout(() => {
          this.successMessage = '';
        }, 4000);
      },
      error: (err: unknown) => {
        console.error('Failed to deactivate user', err);

        this.errorMessage = 'Failed to deactivate user. Please try again.';
        this.deletingUser = false;

        setTimeout(() => {
          this.errorMessage = '';
        }, 4000);
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