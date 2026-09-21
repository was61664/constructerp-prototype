import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import type { Rental } from '../../core/models';
import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { LayoutService } from '../../core/services/layout';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { KpiCard } from '../../shared/components/kpi-card/kpi-card';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { RecordCard, type RecordField } from '../../shared/components/record-card/record-card';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';

@Component({
  selector: 'app-rentals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, KpiCard, MatTableModule, PageHeader, RecordCard, SectionCard, StatusChip],
  templateUrl: './rentals.html',
  styleUrl: './rentals.scss',
})
export class Rentals {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);
  protected readonly layout = inject(LayoutService);

  protected readonly columns = [
    'vendor',
    'asset',
    'project',
    'returnDate',
    'amount',
    'status',
  ] as const;

  protected readonly committed = computed(() =>
    this.store.rentals().reduce((sum, rental) => sum + rental.amount, 0),
  );

  protected readonly overdueCount = computed(
    () => this.store.rentals().filter((rental) => rental.status === 'Overdue').length,
  );

  protected fieldsFor(rental: Rental): RecordField[] {
    return [
      { label: this.i18n.t('project'), value: this.i18n.text(rental.project) },
      { label: this.i18n.t('returnDate'), value: this.i18n.formatDateLabel(rental.returnDate) },
      { label: this.i18n.t('amount'), value: this.i18n.formatMoney(rental.amount), numeric: true },
    ];
  }
}
