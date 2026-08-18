import { Routes } from '@angular/router';

export const VEHICULES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/list/list').then((m) => m.VehiculesListPage)
  }
];
