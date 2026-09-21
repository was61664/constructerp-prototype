import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { KpiCard } from '../../shared/components/kpi-card/kpi-card';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';

@Component({
  selector: 'app-rentals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, KpiCard, MatTableModule, PageHeader, SectionCard, StatusChip],
  templateUrl: './rentals.html',
  styleUrl: './rentals.scss',
})
export class Rentals {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);

  protected readonly columns = ['vendor', 'asset', 'project', 'returnDate', 'amount', 'status'] as const;

  protected readonly committed = computed(() =>
    this.store.rentals().reduce((sum, rental) => sum + rental.amount, 0),
  );

  protected readonly overdueCount = computed(
    () => this.store.rentals().filter((rental) => rental.status === 'Overdue').length,
  );
}
