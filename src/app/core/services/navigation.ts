import { Injectable, computed, inject } from '@angular/core';

import type { LocalisedNavGroup, NavGroup } from '../models';
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

  readonly groups = computed<LocalisedNavGroup[]>(() =>
    NAV_GROUPS.map((group) => ({
      id: group.id,
      label: this.i18n.navGroupLabel(group.id),
      items: group.items.map((item) => ({
        ...item,
        ...this.i18n.moduleLabel(item.id),
      })),
    })),
  );
}
