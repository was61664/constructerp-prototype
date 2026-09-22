import { Routes } from '@angular/router';

/**
 * One lazily-loaded route per module. Replaces the previous `@switch` on a
 * signal, which gave the app no URLs, no deep links and no working back button.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Dashboard · ConstructERP',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'projects',
    title: 'Projects · ConstructERP',
    loadComponent: () => import('./features/projects/projects').then((m) => m.Projects),
  },
  {
    path: 'equipment',
    title: 'Equipment · ConstructERP',
    loadComponent: () => import('./features/equipment/equipment').then((m) => m.EquipmentPage),
  },
  {
    path: 'requests',
    title: 'Requests · ConstructERP',
    loadComponent: () => import('./features/requests/requests').then((m) => m.Requests),
  },
  {
    path: 'rentals',
    title: 'Rentals · ConstructERP',
    loadComponent: () => import('./features/rentals/rentals').then((m) => m.Rentals),
  },
  {
    path: 'transport',
    title: 'Transport · ConstructERP',
    loadComponent: () => import('./features/transport/transport').then((m) => m.Transport),
  },
  {
    path: 'inspections',
    title: 'Inspections · ConstructERP',
    loadComponent: () => import('./features/inspections/inspections').then((m) => m.Inspections),
  },
  {
    path: 'costs',
    title: 'Project Costs · ConstructERP',
    loadComponent: () => import('./features/costs/costs').then((m) => m.Costs),
  },
  {
    path: 'reports',
    title: 'Reports · ConstructERP',
    loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
  },
  { path: '**', redirectTo: 'dashboard' },
];
