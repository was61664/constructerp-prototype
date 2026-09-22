import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LucideDownload } from '@lucide/angular';

import { ErpStore } from '../../core/services/erp-store';
import { ExportService } from '../../core/services/export';
import { I18nService } from '../../core/services/i18n';
import { KpiCard } from '../../shared/components/kpi-card/kpi-card';
import { MeterBar } from '../../shared/components/meter-bar/meter-bar';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KpiCard,
    MatButtonModule,
    MatTooltipModule,
    MeterBar,
    PageHeader,
    SectionCard,
    StatusChip,
    LucideDownload,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly router = inject(Router);
  private readonly exportService = inject(ExportService);

  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);

  /** Equipment utilization summary — the report the Export button promised. */
  protected exportUtilization(): void {
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
        { header: 'Next action', value: (item) => item.nextAction },
      ],
      this.store.equipment(),
    );
  }

  protected openAsset(id: string): void {
    this.store.selectEquipment(id);
    void this.router.navigate(['/equipment']);
  }
}
