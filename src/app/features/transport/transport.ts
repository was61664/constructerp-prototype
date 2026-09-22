import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { LucideMapPinned } from '@lucide/angular';

import type { TransportMove } from '../../core/models';
import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { LayoutService } from '../../core/services/layout';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { MeterBar } from '../../shared/components/meter-bar/meter-bar';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { RecordCard, type RecordField } from '../../shared/components/record-card/record-card';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';

@Component({
  selector: 'app-transport',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyState,
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

  protected readonly columns = ['route', 'kind', 'project', 'cost', 'schedule', 'status'] as const;

  protected readonly totalCost = computed(() =>
    this.store.transportMoves().reduce((sum, move) => sum + move.cost, 0),
  );

  protected routeLabel(move: TransportMove): string {
    return `${this.i18n.text(move.origin)} → ${this.i18n.text(move.destination)}`;
  }

  protected fieldsFor(move: TransportMove): RecordField[] {
    return [
      { label: this.i18n.t('moveType'), value: this.i18n.text(move.kind) },
      { label: this.i18n.t('project'), value: this.i18n.text(move.project) },
      { label: this.i18n.t('cost'), value: this.i18n.formatMoney(move.cost), numeric: true },
      { label: this.i18n.t('schedule'), value: this.i18n.formatDateLabel(move.schedule) },
    ];
  }
}
