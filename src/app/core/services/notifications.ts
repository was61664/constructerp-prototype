import { Injectable, computed, inject } from '@angular/core';

import type { StatusTone } from '../../shared/components/status-chip/status-chip';
import { ErpStore } from './erp-store';
import { I18nService } from './i18n';

export interface AppNotification {
  key: string;
  tone: StatusTone;
  title: string;
  detail: string;
  route: string;
  selectEquipmentId?: string;
}

/**
 * The notification feed is DERIVED, not stored.
 *
 * Every entry is a live consequence of the current data — an overdue rental is
 * overdue because its record says so. Nothing here is invented, and nothing
 * needs dismissing: fix the underlying record and the entry disappears on its
 * own. When a backend arrives this becomes a server-side query, but the shape
 * stays the same.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly store = inject(ErpStore);
  private readonly i18n = inject(I18nService);

  readonly notifications = computed<AppNotification[]>(() => [
    ...this.overdueRentals(),
    ...this.inspectionFindings(),
    ...this.assetsNeedingAttention(),
    ...this.requestsAwaitingInspection(),
  ]);

  readonly count = computed(() => this.notifications().length);

  /** Overdue rentals cost money every day they are not returned. */
  private overdueRentals(): AppNotification[] {
    return this.store
      .rentals()
      .filter((rental) => rental.status === 'Overdue')
      .map((rental) => ({
        key: `rental-overdue:${rental.vendor}:${rental.asset}`,
        tone: 'danger' as const,
        title: this.i18n.format('notifyOverdueRental', { asset: this.i18n.text(rental.asset) }),
        detail: `${this.i18n.text(rental.vendor)} · ${this.i18n.formatDateLabel(rental.returnDate)}`,
        route: '/rentals',
      }));
  }

  private inspectionFindings(): AppNotification[] {
    return this.store
      .inspections()
      .filter((inspection) => inspection.status !== 'Passed')
      .map((inspection) => ({
        key: `inspection:${inspection.asset}:${inspection.inspector}`,
        tone: inspection.status === 'Attention' ? ('warn' as const) : ('info' as const),
        title: this.i18n.format('notifyInspection', { asset: this.i18n.text(inspection.asset) }),
        detail: `${this.i18n.text(inspection.status)} · ${this.i18n.text(inspection.project)}`,
        route: '/inspections',
      }));
  }

  private assetsNeedingAttention(): AppNotification[] {
    return this.store.attentionAssets().map((item) => ({
      key: `asset:${item.id}`,
      tone: item.status === 'Inspection Due' ? ('danger' as const) : ('warn' as const),
      title: this.i18n.format('notifyAsset', { asset: this.i18n.text(item.name) }),
      detail: `${this.i18n.text(item.status)} · ${this.i18n.text(item.nextAction)}`,
      route: '/equipment',
      selectEquipmentId: item.id,
    }));
  }

  /** The gate that stops equipment being used before it is inspected. */
  private requestsAwaitingInspection(): AppNotification[] {
    return this.store
      .requests()
      .filter((request) => request.status === 'Inspection Pending')
      .map((request) => ({
        key: `request:${request.id}`,
        tone: 'warn' as const,
        title: this.i18n.format('notifyRequest', { id: request.id }),
        detail: `${this.i18n.text(request.equipment)} · ${this.i18n.text(request.project)}`,
        route: '/requests',
      }));
  }
}
