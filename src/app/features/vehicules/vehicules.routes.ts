import { Routes } from '@angular/router';

export const VEHICULES_ROUTES: Routes = [
  {
    path: 'nouveau',
    loadComponent: () => import('./pages/create/create').then((m) => m.VehiculeCreatePage)
  },
  {
    path: ':id/modifier',
    loadComponent: () => import('./pages/edit/edit').then((m) => m.VehiculeEditPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/detail/detail').then((m) => m.VehiculeDetailPage)
  },
  {
    path: '',
    loadComponent: () => import('./pages/list/list').then((m) => m.VehiculesListPage)
  }
];
