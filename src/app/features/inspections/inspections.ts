import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { LucideCamera, LucideSignature } from '@lucide/angular';

import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';

@Component({
  selector: 'app-inspections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyState,
    MatTableModule,
    PageHeader,
    SectionCard,
    StatusChip,
    LucideCamera,
    LucideSignature,
  ],
  templateUrl: './inspections.html',
  styleUrl: './inspections.scss',
})
export class Inspections {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);

  protected readonly columns = ['asset', 'project', 'media', 'inspector', 'status'] as const;
}
