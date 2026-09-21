import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LucideDownload } from '@lucide/angular';

import { ErpStore } from '../../core/services/erp-store';
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

  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);

  protected openAsset(id: string): void {
    this.store.selectEquipment(id);
    void this.router.navigate(['/equipment']);
  }
}
