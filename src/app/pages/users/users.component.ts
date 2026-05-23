import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './users.component.html',
  providers: [DatePipe],
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm = '';

  showModal = false;
  selectedUser: any = null;
  loading = false;

  constructor(
    private adminService: AdminService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;

    this.adminService.getUsers().subscribe({
      next: (res: any) => {
        this.users = res.map((u: any) => this.mapUser(u));
        this.filteredUsers = [...this.users];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  mapUser(u: any) {
    const isActive = u.active === true && u.locked === false;

    return {
      id: u.id,
      userId: u.userId,
      name: u.name,
      email: u.email,
      phone: u.phone,
      joinDate: this.datePipe.transform(u.joined, 'dd/MM/yyyy'),
      active: isActive,
      locked: u.locked,
      status: isActive ? 'Active' : 'Inactive',
    };
  }
  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter((u) => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const userId = (u.userId || '').toLowerCase();

      return name.includes(term) || email.includes(term) || userId.includes(term);
    });
  }

  viewUser(user: any): void {
    this.selectedUser = { ...user };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
  }

  toggleStatus(user: any): void {
    const originalActive = user.active;

    // instant UI update
    user.active = !user.active;
    user.status = user.active ? 'Active' : 'Inactive';
    user.locked = !user.active;

    this.filteredUsers = [...this.filteredUsers];
    this.users = [...this.users];

    this.adminService.updateUserStatus(user.id, user.active).subscribe({
      next: (updatedUser: any) => {
        const mapped = this.mapUser(updatedUser);

        this.users = this.users.map((u) => (u.id === user.id ? mapped : u));

        this.filteredUsers = this.filteredUsers.map((u) => (u.id === user.id ? mapped : u));
      },

      error: (err) => {
        console.error('Failed to update user status', err);

        // rollback if backend fails
        user.active = originalActive;
        user.status = originalActive ? 'Active' : 'Inactive';
        user.locked = !originalActive;

        this.filteredUsers = [...this.filteredUsers];
        this.users = [...this.users];
      },
    });
  }
  deleteUser(user: any): void {
    const confirmed = confirm(
      'Are you sure you want to delete this user?\n\n' +
        'This action will permanently block the user access to the system.\n' +
        'The user will no longer be able to log in or register again using the same email.\n\n' +
        'Existing bookings, orders, and reviews will be kept for security and record purposes.',
    );

    if (!confirmed) return;

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to delete user', err);
      },
    });
  }

  trackByUserId(index: number, user: any): number {
    return user.id;
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter((u) => u.active).length;
  }

  get inactiveUsers(): number {
    return this.users.filter((u) => !u.active).length;
  }
}
