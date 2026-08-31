import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard-page').then((m) => m.DashboardPage)
  }
  ,
  {
    path: 'synthese-mecaniciens',
    loadComponent: () => import('./pages/synthese-mecaniciens/synthese-mecaniciens-page').then((m) => m.SyntheseMecaniciensPage)
  }
];
