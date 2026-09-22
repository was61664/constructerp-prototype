import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { KpiCard } from '../../shared/components/kpi-card/kpi-card';
import { MeterBar } from '../../shared/components/meter-bar/meter-bar';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SectionCard } from '../../shared/components/section-card/section-card';

@Component({
  selector: 'app-costs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, KpiCard, MeterBar, PageHeader, SectionCard],
  templateUrl: './costs.html',
  styleUrl: './costs.scss',
})
export class Costs {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);

  protected readonly totals = computed(() =>
    this.store.projectCosts().reduce(
      (sum, line) => ({
        equipment: sum.equipment + line.equipment,
        transport: sum.transport + line.transport,
        extras: sum.extras + line.extras,
      }),
      { equipment: 0, transport: 0, extras: 0 },
    ),
  );

  protected lineTotal(equipment: number, transport: number, extras: number): number {
    return equipment + transport + extras;
  }

  /** Each category as a percentage of the line total, for the split bars. */
  protected share(part: number, total: number): number {
    return total ? Math.round((part / total) * 100) : 0;
  }
}
