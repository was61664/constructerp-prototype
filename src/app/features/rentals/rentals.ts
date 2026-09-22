import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

import type { Rental } from '../../core/models';
import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { LayoutService } from '../../core/services/layout';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { KpiCard } from '../../shared/components/kpi-card/kpi-card';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { BusyIcon } from '../../shared/components/busy-icon/busy-icon';
import { RecordCard, type RecordField } from '../../shared/components/record-card/record-card';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';
import { BusyState } from '../../shared/utils/busy-state';

@Component({
  selector: 'app-rentals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BusyIcon,
    EmptyState,
    KpiCard,
    MatButtonModule,
    MatTableModule,
    PageHeader,
    RecordCard,
    SectionCard,
    StatusChip,
  ],
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
    'actions',
  ] as const;

  /** One gear at a time, keyed by rental id and action. */
  protected readonly busy = new BusyState();
  protected readonly actionError = signal<string | null>(null);

  protected readonly onHire = computed(
    () => this.store.rentals().filter((rental) => !rental.returnedOn).length,
  );

  protected readonly committed = computed(() =>
    this.store
      .rentals()
      .filter((rental) => !rental.returnedOn)
      .reduce((sum, rental) => sum + rental.amount, 0),
  );

  /**
   * Counted off the status the API derived, not off a field anyone typed. This
   * number is now a fact about the return dates rather than a record of who
   * last remembered to update a row.
   */
  protected readonly overdueCount = computed(
    () => this.store.rentals().filter((rental) => rental.status === 'Overdue').length,
  );

  /** How late, or how long left — the detail the bare status does not carry. */
  protected due(rental: Rental): string {
    if (rental.returnedOn) {
      return this.i18n.formatIsoDate(rental.returnedOn);
    }

    if (rental.daysOverdue > 0) {
      return this.i18n.format('daysLate', {
        days: this.i18n.formatInteger(rental.daysOverdue),
      });
    }

    const days = Math.round((Date.parse(rental.returnDate) - Date.now()) / 86_400_000);

    return days <= 0
      ? this.i18n.t('dueToday')
      : this.i18n.format('daysLeft', { days: this.i18n.formatInteger(days) });
  }

  protected fieldsFor(rental: Rental): RecordField[] {
    return [
      { label: this.i18n.t('project'), value: this.i18n.text(rental.project) },
      { label: this.i18n.t('dueBack'), value: this.i18n.formatIsoDate(rental.returnDate) },
      { label: this.i18n.t('status'), value: this.due(rental) },
      { label: this.i18n.t('amount'), value: this.i18n.formatMoney(rental.amount), numeric: true },
    ];
  }

  /**
   * Both actions record an event and let the API re-derive the status. Note
   * there is no "mark overdue" next to them: that is not something a person
   * decides, which is the whole point of the change.
   */
  protected async bookReturn(rental: Rental): Promise<void> {
    await this.run(`book:${rental.id}`, () => this.store.bookRentalReturn(rental.id));
  }

  protected async recordReturn(rental: Rental): Promise<void> {
    await this.run(`return:${rental.id}`, () => this.store.returnRental(rental.id));
  }

  private async run(key: string, work: () => Promise<void>): Promise<void> {
    this.actionError.set(null);

    try {
      await this.busy.run(key, work);
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
