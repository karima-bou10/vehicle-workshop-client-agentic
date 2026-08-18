import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/role.model';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = (route.data['roles'] as Role[] | undefined) ?? [];
  if (expectedRoles.length === 0) {
    return true;
  }

  return authService.hasAnyRole(expectedRoles) ? true : router.createUrlTree(['/dashboard']);
};
