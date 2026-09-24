import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { LucidePlus, LucideTrash2 } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import type { CostEntry, ProjectCostLine } from '../../core/models';
import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { BusyIcon } from '../../shared/components/busy-icon/busy-icon';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { KpiCard } from '../../shared/components/kpi-card/kpi-card';
import { MeterBar } from '../../shared/components/meter-bar/meter-bar';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { BusyState } from '../../shared/utils/busy-state';
import {
  CostEntryDialog,
  type CostEntryFormData,
  type CostEntryFormResult,
} from './cost-entry-dialog/cost-entry-dialog';

@Component({
  selector: 'app-costs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BusyIcon,
    EmptyState,
    KpiCard,
    LucidePlus,
    LucideTrash2,
    MatButtonModule,
    MeterBar,
    PageHeader,
    SectionCard,
  ],
  templateUrl: './costs.html',
  styleUrl: './costs.scss',
})
export class Costs {
  private readonly dialog = inject(MatDialog);

  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);

  protected readonly busy = new BusyState();
  protected readonly actionError = signal<string | null>(null);

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

  /**
   * The rows the figures above are summed from.
   *
   * Shown beside the totals deliberately: a number and its own workings on one
   * card is the whole reason spend stopped being a field somebody typed.
   */
  protected entriesFor(line: ProjectCostLine): CostEntry[] {
    return this.store.costEntriesForProject(line.projectId);
  }

  protected async add(line: ProjectCostLine): Promise<void> {
    const result = await firstValueFrom(
      this.dialog
        .open<CostEntryDialog, CostEntryFormData, CostEntryFormResult>(CostEntryDialog, {
          data: { projectId: line.projectId, projectName: line.project },
          width: '520px',
        })
        .afterClosed(),
    );

    if (!result) {
      return;
    }

    await this.run(`add:${line.projectId}`, () =>
      this.store.createCostEntry({ projectId: line.projectId, ...result }),
    );
  }

  protected async remove(entry: CostEntry): Promise<void> {
    await this.run(`delete:${entry.id}`, () => this.store.deleteCostEntry(entry.id));
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
