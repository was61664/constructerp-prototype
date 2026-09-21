import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { LucideMapPinned } from '@lucide/angular';

import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { MeterBar } from '../../shared/components/meter-bar/meter-bar';
import { PageHeader } from '../../shared/components/page-header/page-header';
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

  protected readonly columns = ['route', 'kind', 'project', 'cost', 'schedule', 'status'] as const;

  protected readonly totalCost = computed(() =>
    this.store.transportMoves().reduce((sum, move) => sum + move.cost, 0),
  );
}
