import { Injectable, computed, inject } from '@angular/core';

import type { LocalisedNavGroup, NavGroup } from '../models';
import { AuthService } from './auth';
import { I18nService } from './i18n';

/**
 * Sidebar structure. Grouping is business-driven — main data is separated from
 * day-to-day project operations — so it is defined here rather than derived
 * from the route table.
 */
const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'overview',
    items: [{ id: 'dashboard', route: 'dashboard', icon: 'gauge' }],
  },
  {
    id: 'mainData',
    items: [
      { id: 'projects', route: 'projects', icon: 'building' },
      { id: 'equipment', route: 'equipment', icon: 'boxes' },
      { id: 'rentals', route: 'rentals', icon: 'warehouse' },
    ],
  },
  {
    id: 'projectOperations',
    items: [
      { id: 'requests', route: 'requests', icon: 'clipboardList' },
      { id: 'transport', route: 'transport', icon: 'truck' },
      { id: 'inspections', route: 'inspections', icon: 'clipboardCheck' },
      { id: 'costs', route: 'costs', icon: 'money' },
    ],
  },
  {
    id: 'analytics',
    items: [{ id: 'reports', route: 'reports', icon: 'chart' }],
  },
];

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);

  /**
   * Filtered to what the signed-in role can reach, and empty groups dropped.
   *
   * Cosmetic, not protective — the API refuses these routes and the route
   * guard turns them away. This only avoids offering someone a door that
   * opens onto a 403.
   */
  readonly groups = computed<LocalisedNavGroup[]>(() =>
    NAV_GROUPS.map((group) => ({
      id: group.id,
      label: this.i18n.navGroupLabel(group.id),
      items: group.items
        .filter((item) => this.auth.canReach(item.route))
        .map((item) => ({
          ...item,
          ...this.i18n.moduleLabel(item.id),
        })),
    })).filter((group) => group.items.length > 0),
  );
}
