import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
	},
	{
		path: '',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./core/layout/app-layout/app-layout').then((m) => m.AppLayout),
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'dashboard'
			},
			{
				path: 'dashboard',
				loadChildren: () =>
					import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES)
			},
			{
				path: 'interventions',
				loadChildren: () =>
					import('./features/interventions/interventions.routes').then((m) => m.INTERVENTIONS_ROUTES)
			},
			{
				path: 'vehicules',
				loadChildren: () =>
					import('./features/vehicules/vehicules.routes').then((m) => m.VEHICULES_ROUTES)
			},
			{
				path: 'mecaniciens',
				canActivate: [roleGuard],
				data: { roles: ['ROLE_MANAGER'] },
				loadChildren: () =>
					import('./features/mecaniciens/mecaniciens.routes').then((m) => m.MECANICIENS_ROUTES)
			}
		]
	},
	{
		path: '**',
		redirectTo: ''
	}
];
