import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { LucideMapPinned } from '@lucide/angular';

import type { TransportAction, TransportMove } from '../../core/models';
import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { LayoutService } from '../../core/services/layout';
import { BusyIcon } from '../../shared/components/busy-icon/busy-icon';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { KpiCard } from '../../shared/components/kpi-card/kpi-card';
import { MeterBar } from '../../shared/components/meter-bar/meter-bar';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { RecordCard, type RecordField } from '../../shared/components/record-card/record-card';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';
import { BusyState } from '../../shared/utils/busy-state';

@Component({
  selector: 'app-transport',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BusyIcon,
    EmptyState,
    KpiCard,
    MatButtonModule,
    MatTableModule,
    MeterBar,
    PageHeader,
    RecordCard,
    SectionCard,
    StatusChip,
    LucideMapPinned,
  ],
  templateUrl: './transport.html',
  styleUrl: './transport.scss',
})
export class Transport {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);
  protected readonly layout = inject(LayoutService);

  protected readonly columns = [
    'route',
    'kind',
    'project',
    'cost',
    'schedule',
    'status',
    'actions',
  ] as const;

  protected readonly busy = new BusyState();
  protected readonly actionError = signal<string | null>(null);

  protected readonly totalCost = computed(() =>
    this.store.transportMoves().reduce((sum, move) => sum + move.cost, 0),
  );

  protected readonly openCount = computed(
    () => this.store.transportMoves().filter((move) => !move.arrivedAt && !move.cancelledAt).length,
  );

  /**
   * Counted off the flag the API derived from the booked slot, not off anything
   * a person ticked. The prototype could not answer this at all — its schedule
   * was a label like "ETA 16:30" that nothing could compare against now.
   */
  protected readonly lateCount = computed(
    () => this.store.transportMoves().filter((move) => move.isLate).length,
  );

  protected routeLabel(move: TransportMove): string {
    return `${this.i18n.text(move.origin)} → ${this.i18n.text(move.destination)}`;
  }

  /** The label for each transition, so the template stays declarative. */
  protected actionLabel(action: TransportAction): string {
    switch (action) {
      case 'approve':
        return this.i18n.t('approveMove');
      case 'depart':
        return this.i18n.t('departMove');
      case 'arrive':
        return this.i18n.t('arriveMove');
      case 'cancel':
        return this.i18n.t('cancelMove');
    }
  }

  protected fieldsFor(move: TransportMove): RecordField[] {
    return [
      { label: this.i18n.t('moveType'), value: this.i18n.text(move.kind) },
      { label: this.i18n.t('project'), value: this.i18n.text(move.project) || '—' },
      { label: this.i18n.t('schedule'), value: this.i18n.formatIsoDateTime(move.schedule) },
      { label: this.i18n.t('cost'), value: this.i18n.formatMoney(move.cost), numeric: true },
    ];
  }

  /**
   * Records one event. There is no "set status" counterpart, deliberately:
   * a move is In Transit because a departure was recorded for it.
   */
  protected async run(move: TransportMove, action: TransportAction): Promise<void> {
    this.actionError.set(null);

    try {
      await this.busy.run(`${action}:${move.id}`, () =>
        this.store.transitionTransportMove(move.id, action),
      );
    } catch (error) {
      this.actionError.set(this.describe(error));
    }
  }

  /** Surfaces the API's own refusal text rather than a generic failure. */
  private describe(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = (error as { error?: { error?: string } }).error;

      if (body?.error) {
        return body.error;
      }
    }

    return this.i18n.t('actionFailed');
  }
}
