import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  Router,
} from '@angular/router';

import { UserRole } from '../enum/user-role';
import { TokenStorageService } from '../service/token-storage.service';

const resolveAllowedRoles = (route: ActivatedRouteSnapshot): UserRole[] | undefined => {
  const matchedRoute = [...route.pathFromRoot]
    .reverse()
    .find((item) => Array.isArray(item.data?.['roles']));

  if (!matchedRoute) {
    return undefined;
  }

  return matchedRoute.data['roles'] as UserRole[];
};

const hasRoleAccess = (
  route: ActivatedRouteSnapshot,
  tokenStorageService: TokenStorageService,
  router: Router,
) => {
  if (!tokenStorageService.hasValidToken()) {
    tokenStorageService.clearAll();
    return router.createUrlTree(['/login']);
  }

  const currentUser = tokenStorageService.decodeToken();
  if (!currentUser) {
    tokenStorageService.clearAll();
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = resolveAllowedRoles(route);
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return router.createUrlTree(['/home/dashboard']);
  }

  return true;
};

export const authGuard: CanActivateFn = (route) => {
  const tokenStorageService = inject(TokenStorageService);
  const router = inject(Router);

  return hasRoleAccess(route, tokenStorageService, router);
};

export const authChildGuard: CanActivateChildFn = (childRoute) => {
  const tokenStorageService = inject(TokenStorageService);
  const router = inject(Router);

  return hasRoleAccess(childRoute, tokenStorageService, router);
};
