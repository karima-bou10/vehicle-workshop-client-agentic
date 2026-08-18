import { Routes } from '@angular/router';

export const INTERVENTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/list/list').then((m) => m.InterventionsListPage)
  },
  {
    path: 'nouveau',
    loadComponent: () => import('./pages/form/form').then((m) => m.InterventionsFormPage)
  },
    {
    path: 'diagnostic',
    loadComponent: () => import('./pages/diagnostic/diagnostic').then((m) => m.InterventionsDiagnosticPage)
  },
  {
    path: 'devis',
    loadComponent: () => import('./pages/devis/devis').then((m) => m.InterventionsDevisPage)
  },
  {
    path: 'affectation',
    loadComponent: () => import('./pages/affectation/affectation').then((m) => m.InterventionsAffectationPage)
  },
  {
    path: 'historique',
    loadComponent: () => import('./pages/historique/historique').then((m) => m.InterventionsHistoriquePage)
  },
  {
    path: ':numero',
    loadComponent: () => import('./pages/detail/detail').then((m) => m.InterventionsDetailPage)
  },
  {
    path: ':numero/modifier',
    loadComponent: () => import('./pages/form/form').then((m) => m.InterventionsFormPage)
  }
];

