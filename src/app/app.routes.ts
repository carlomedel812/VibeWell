import { Routes } from '@angular/router';

import { authChildGuard, authGuard } from '../core/guards/auth.guard';
import { UserRole } from '../core/enum/user-role';
import { guestGuard } from '../core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('../pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('../pages/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    data: { roles: [UserRole.ADMIN, UserRole.USER] },
    loadComponent: () =>
      import('../pages/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        data: { roles: [UserRole.ADMIN, UserRole.USER] },
        loadComponent: () =>
          import('../pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'users-management',
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('../pages/users-management/users-management.component').then((m) => m.UsersManagementComponent),
      },
      {
        path: 'profile',
        data: { roles: [UserRole.ADMIN, UserRole.USER] },
        loadComponent: () =>
          import('../pages/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'assessment/:id',
        data: { roles: [UserRole.ADMIN, UserRole.USER] },
        loadComponent: () =>
          import('../pages/assessment/assessment.component').then((m) => m.AssessmentComponent),
      }
    ],
  },
];
