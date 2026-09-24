import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './core/guards/auth-guard';
import { Shell } from './layout/shell/shell';

/**
 * One lazily-loaded route per module. Replaces the previous `@switch` on a
 * signal, which gave the app no URLs, no deep links and no working back button.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    // Outside the guards, obviously — and outside the shell, so the sidebar
    // and toolbar are not visible to someone who has not signed in.
    path: 'login',
    title: 'Sign in · ConstructERP',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    // The shell is a LAYOUT route, so the sidebar and toolbar exist only for
    // signed-in users. Rendering them around the login form would show
    // navigation to someone who cannot use any of it.
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard · ConstructERP',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        canActivate: [authGuard, roleGuard],
      },
      {
        path: 'projects',
        title: 'Projects · ConstructERP',
        loadComponent: () => import('./features/projects/projects').then((m) => m.Projects),
        canActivate: [authGuard, roleGuard],
      },
      {
        path: 'equipment',
        title: 'Equipment · ConstructERP',
        loadComponent: () => import('./features/equipment/equipment').then((m) => m.EquipmentPage),
        canActivate: [authGuard, roleGuard],
      },
      {
        path: 'requests',
        title: 'Requests · ConstructERP',
        loadComponent: () => import('./features/requests/requests').then((m) => m.Requests),
        canActivate: [authGuard, roleGuard],
      },
      {
        path: 'rentals',
        title: 'Rentals · ConstructERP',
        loadComponent: () => import('./features/rentals/rentals').then((m) => m.Rentals),
        canActivate: [authGuard, roleGuard],
      },
      {
        path: 'transport',
        title: 'Transport · ConstructERP',
        loadComponent: () => import('./features/transport/transport').then((m) => m.Transport),
        canActivate: [authGuard, roleGuard],
      },
      {
        path: 'inspections',
        title: 'Inspections · ConstructERP',
        loadComponent: () =>
          import('./features/inspections/inspections').then((m) => m.Inspections),
        canActivate: [authGuard, roleGuard],
      },
      {
        path: 'costs',
        title: 'Project Costs · ConstructERP',
        loadComponent: () => import('./features/costs/costs').then((m) => m.Costs),
        canActivate: [authGuard, roleGuard],
      },
      {
        path: 'reports',
        title: 'Reports · ConstructERP',
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
        canActivate: [authGuard, roleGuard],
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
