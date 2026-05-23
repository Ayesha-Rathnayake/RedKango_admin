import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('admin_token');
    this.router.navigate(['/login']);
  }
}