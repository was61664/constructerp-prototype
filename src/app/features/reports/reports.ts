import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideDownload } from '@lucide/angular';

import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SectionCard } from '../../shared/components/section-card/section-card';
import type { TranslationKey } from '../../core/i18n/translations';

interface ReportSummary {
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
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);

  /**
   * Report cards were previously static text. They now show real figures off
   * the store — still a preview, but one that moves with the data.
   */
  protected readonly reports = computed<ReportSummary[]>(() => {
    const overdue = this.store.rentals().filter((rental) => rental.status === 'Overdue').length;
    const openFindings = this.store
      .inspections()
      .filter((inspection) => inspection.status !== 'Passed').length;

    return [
      {
        titleKey: 'utilizationReport',
        value: this.i18n.formatPercent(this.store.totals().avgUtilization),
        captionKey: 'avgUtilization',
      },
      {
        titleKey: 'rentalReport',
        value: this.i18n.formatInteger(overdue),
        captionKey: 'attentionQueue',
      },
      {
        titleKey: 'inspectionReport',
        value: this.i18n.formatInteger(openFindings),
        captionKey: 'attentionQueue',
      },
    ];
  });
}
