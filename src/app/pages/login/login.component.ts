import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  loading = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(form: NgForm) {
    this.errorMessage = '';

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },

      error: (err) => {
        this.loading = false;

        if (err.message === 'Access denied') {
          this.errorMessage = 'You do not have admin access.';
          return;
        }

        const status = err.status;
        const msg: string = err.error?.message ?? '';

        if (status === 401) {
          if (msg === 'Account not verified') {
            this.errorMessage = 'This account is not verified.';
          } else if (msg === 'Account locked') {
            this.errorMessage = 'This account has been locked.';
          } else {
            this.errorMessage = 'Invalid email or password.';
          }
        } else if (status === 0) {
          this.errorMessage = 'Cannot reach the server. Please try again.';
        } else if (status >= 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = msg || 'Login failed. Please try again.';
        }
      }
    });
  }
}