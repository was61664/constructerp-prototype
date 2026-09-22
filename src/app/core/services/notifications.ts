import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

import type { StatusTone } from '../../shared/components/status-chip/status-chip';
import { ErpStore } from './erp-store';
import { I18nService } from './i18n';

export interface AppNotification {
  key: string;
  tone: StatusTone;
  title: string;
  detail: string;
  route: string;
  read: boolean;
  selectEquipmentId?: string;
}

const READ_STORAGE_KEY = 'constructerp.notificationsRead';

/**
 * The notification feed is DERIVED, not stored.
 *
 * Every entry is a live consequence of the current data — an overdue rental is
 * overdue because its record says so. Fix the underlying record and the entry
 * disappears on its own. When a backend arrives this becomes a server-side
 * query, but the shape stays the same.
 *
 * Read state is layered on top, and the distinction matters:
 *
 *   count       — how many issues are OPEN. Drops only when the data is fixed.
 *   unreadCount — how many the user has not looked at yet. Drops on click.
 *
 * The badge shows `unreadCount`, because a bell means "something new", not
 * "something wrong". Showing the open count there made clicking an entry look
 * broken: the user acted, and the number did not move.
 *
 * A key that leaves the feed is dropped from the read set, so if the same issue
 * recurs later it is correctly unread again.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly store = inject(ErpStore);
  private readonly i18n = inject(I18nService);
  private readonly document = inject(DOCUMENT);

  private readonly readKeys = signal<ReadonlySet<string>>(this.restore());

  private readonly derived = computed(() => [
    ...this.overdueRentals(),
    ...this.inspectionFindings(),
    ...this.assetsNeedingAttention(),
    ...this.requestsAwaitingInspection(),
  ]);

  readonly notifications = computed<AppNotification[]>(() => {
    const read = this.readKeys();

    return this.derived().map((item) => ({ ...item, read: read.has(item.key) }));
  });

  /** Open issues, regardless of whether they have been seen. */
  readonly count = computed(() => this.derived().length);

  /** What the badge shows. */
  readonly unreadCount = computed(() => this.notifications().filter((item) => !item.read).length);

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  markRead(key: string): void {
    if (this.readKeys().has(key)) {
      return;
    }

    this.commit(new Set([...this.readKeys(), key]));
  }

  markAllRead(): void {
    this.commit(new Set(this.derived().map((item) => item.key)));
  }

  private commit(next: ReadonlySet<string>): void {
    // Keep only keys that are still in the feed, so storage cannot grow without
    // bound and a recurring issue comes back as unread.
    const live = new Set(this.derived().map((item) => item.key));
    const pruned = new Set([...next].filter((key) => live.has(key)));

    this.readKeys.set(pruned);
    this.persist(pruned);
  }

  private restore(): ReadonlySet<string> {
    try {
      const stored = this.document.defaultView?.localStorage?.getItem(READ_STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : null;

      return Array.isArray(parsed)
        ? new Set(parsed.filter((k): k is string => typeof k === 'string'))
        : new Set();
    } catch {
      return new Set();
    }
  }

  private persist(keys: ReadonlySet<string>): void {
    // Storage throws in private-browsing modes; read state is not worth
    // breaking the app over.
    try {
      this.document.defaultView?.localStorage?.setItem(READ_STORAGE_KEY, JSON.stringify([...keys]));
    } catch {
      // Ignored by design.
    }
  }

  /**
   * Overdue rentals cost money every day they are not returned.
   *
   * The status these are filtered on is derived by the API from the return
   * date, so this badge counts hires that are actually late. It previously
   * counted the ones somebody had got around to marking.
   */
  private overdueRentals(): Omit<AppNotification, 'read'>[] {
    return this.store
      .rentals()
      .filter((rental) => rental.status === 'Overdue')
      .map((rental) => ({
        key: `rental-overdue:${rental.id}`,
        tone: 'danger' as const,
        title: this.i18n.format('notifyOverdueRental', { asset: this.i18n.text(rental.asset) }),
        detail: `${this.i18n.text(rental.vendor)} · ${this.i18n.formatIsoDate(rental.returnDate)}`,
        route: '/rentals',
      }));
  }

  private inspectionFindings(): Omit<AppNotification, 'read'>[] {
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

  private assetsNeedingAttention(): Omit<AppNotification, 'read'>[] {
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
  private requestsAwaitingInspection(): Omit<AppNotification, 'read'>[] {
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
