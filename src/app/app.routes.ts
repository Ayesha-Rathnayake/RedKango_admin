import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';

import { LoginComponent } from './pages/login/login.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BookingsComponent } from './pages/bookings/bookings.component';

import { ProductsComponent } from './pages/products/products.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { ReviewsComponent } from './pages/reviews/reviews.component';
import { CampingTipsComponent } from './pages/camping-tips/camping-tips.component';
import { UsersComponent } from './pages/users/users.component';
import { SettingsComponent } from './pages/settings/settings.component';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [

      { path: 'dashboard', component: DashboardComponent },

      { path: 'bookings', component: BookingsComponent },

      
      { path: 'bookings/:id', component: BookingsComponent },

      { path: 'products', component: ProductsComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'reviews', component: ReviewsComponent },
      { path: 'camping-tips', component: CampingTipsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  },

  { path: '**', redirectTo: 'login' }
];