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
        path: 'admin',
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('../pages/admin/admin.component').then((m) => m.AdminComponent),
      },
      {
        path: ':id',
        data: { roles: [UserRole.ADMIN, UserRole.USER] },
        loadComponent: () =>
          import('../pages/home/components/folder/folder.page').then((m) => m.FolderPage),
      },
    ],
  },
];
