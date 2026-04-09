import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { TokenStorageService } from '../service/token-storage.service';

export const guestGuard: CanActivateFn = () => {
  const tokenStorageService = inject(TokenStorageService);
  const router = inject(Router);

  if (tokenStorageService.hasValidToken()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};
