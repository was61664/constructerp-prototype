import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideDownload } from '@lucide/angular';

import type { TranslationKey } from '../../core/i18n/translations';
import { ErpStore } from '../../core/services/erp-store';
import { ExportService } from '../../core/services/export';
import { I18nService } from '../../core/services/i18n';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SectionCard } from '../../shared/components/section-card/section-card';

type ReportId = 'utilization' | 'rentals' | 'inspections';

interface ReportSummary {
  id: ReportId;
  titleKey: TranslationKey;
  /** Headline figure, already formatted for the active locale. */
  value: string;
  captionKey: TranslationKey;
}

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatTooltipModule, PageHeader, SectionCard, LucideDownload],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports {
  private readonly exportService = inject(ExportService);

  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);

  /**
   * Report cards were previously static text. They now show real figures off
   * the store, and each one exports the data behind its own number.
   */
  protected readonly reports = computed<ReportSummary[]>(() => {
    const overdue = this.store.rentals().filter((rental) => rental.status === 'Overdue').length;
    const openFindings = this.store
      .inspections()
      .filter((inspection) => inspection.status !== 'Passed').length;

    return [
      {
        id: 'utilization',
        titleKey: 'utilizationReport',
        value: this.i18n.formatPercent(this.store.totals().avgUtilization),
        captionKey: 'avgUtilization',
      },
      {
        id: 'rentals',
        titleKey: 'rentalReport',
        value: this.i18n.formatInteger(overdue),
        captionKey: 'attentionQueue',
      },
      {
        id: 'inspections',
        titleKey: 'inspectionReport',
        value: this.i18n.formatInteger(openFindings),
        captionKey: 'attentionQueue',
      },
    ];
  });

  protected export(id: ReportId): void {
    switch (id) {
      case 'utilization':
        this.exportUtilization();
        break;
      case 'rentals':
        this.exportRentals();
        break;
      case 'inspections':
        this.exportInspections();
        break;
    }
  }

  protected exportAll(): void {
    this.exportUtilization();
    this.exportRentals();
    this.exportInspections();
  }

  private exportUtilization(): void {
    this.exportService.exportCsv(
      'constructerp-equipment-utilization',
      [
        { header: 'Code', value: (item) => item.id },
        { header: 'Name', value: (item) => item.name },
        { header: 'Type', value: (item) => item.type },
        { header: 'Ownership', value: (item) => item.ownership },
        { header: 'Project', value: (item) => item.project },
        { header: 'Status', value: (item) => item.status },
        { header: 'Utilization %', value: (item) => item.utilization },
        { header: 'Daily cost (KWD)', value: (item) => item.dailyCost },
      ],
      this.store.equipment(),
    );
  }

  private exportRentals(): void {
    this.exportService.exportCsv(
      'constructerp-rental-commitments',
      [
        { header: 'Vendor', value: (rental) => rental.vendor },
        { header: 'Asset', value: (rental) => rental.asset },
        { header: 'Project', value: (rental) => rental.project },
        { header: 'Due back', value: (rental) => rental.returnDate },
        { header: 'Returned on', value: (rental) => rental.returnedOn ?? '' },
        { header: 'Amount (KWD)', value: (rental) => rental.amount },
        // Derived by the API from the two dates above, so the export cannot
        // disagree with them.
        { header: 'Status', value: (rental) => rental.status },
        { header: 'Days overdue', value: (rental) => rental.daysOverdue },
      ],
      this.store.rentals(),
    );
  }

  private exportInspections(): void {
    this.exportService.exportCsv(
      'constructerp-inspection-register',
      [
        { header: 'Asset', value: (inspection) => inspection.asset },
        { header: 'Project', value: (inspection) => inspection.project },
        { header: 'Status', value: (inspection) => inspection.status },
        { header: 'Media', value: (inspection) => inspection.media },
        { header: 'Inspector', value: (inspection) => inspection.inspector },
      ],
      this.store.inspections(),
    );
  }
}
