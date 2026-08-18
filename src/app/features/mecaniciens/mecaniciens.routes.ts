import { Routes } from '@angular/router';

export const MECANICIENS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/list/list').then((m) => m.MecaniciensListPage)
  }
];
