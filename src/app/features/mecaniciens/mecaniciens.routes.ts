import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const MECANICIENS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/list/list').then((m) => m.MecaniciensListPage)
  },
  {
    path: 'nouveau',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_MANAGER'] },
    loadComponent: () => import('./pages/form/form').then((m) => m.MecaniciensFormPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/detail/detail').then((m) => m.MecaniciensDetailPage)
  },
  {
    path: ':id/modifier',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_MANAGER'] },
    loadComponent: () => import('./pages/form/form').then((m) => m.MecaniciensFormPage)
  }
];
