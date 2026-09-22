import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import type { ProjectRecord } from '../../core/models';
import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { LayoutService } from '../../core/services/layout';
import { BusyIcon } from '../../shared/components/busy-icon/busy-icon';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { MeterBar } from '../../shared/components/meter-bar/meter-bar';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { RecordCard, type RecordField } from '../../shared/components/record-card/record-card';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';
import { ConfirmService } from '../../shared/services/confirm';
import { BusyState } from '../../shared/utils/busy-state';
import { ProjectFormDialog, type ProjectFormData } from './project-form-dialog/project-form-dialog';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BusyIcon,
    EmptyState,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MeterBar,
    PageHeader,
    RecordCard,
    SectionCard,
    StatusChip,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  private readonly dialog = inject(MatDialog);
  private readonly confirmService = inject(ConfirmService);

  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);
  protected readonly layout = inject(LayoutService);

  /** Which button is mid-save, so only that one turns its gear. */
  protected readonly busy = new BusyState();

  protected readonly columns = [
    'name',
    'client',
    'manager',
    'status',
    'budget',
    'spend',
    'linked',
    'actions',
  ] as const;

  protected fieldsFor(project: ProjectRecord): RecordField[] {
    return [
      { label: this.i18n.t('client'), value: this.i18n.text(project.client) },
      { label: this.i18n.t('manager'), value: this.i18n.text(project.manager) },
      { label: this.i18n.t('budget'), value: this.i18n.formatMoney(project.budget), numeric: true },
      {
        label: this.i18n.t('totalSpend'),
        value: this.i18n.formatMoney(this.totalSpend(project)),
        numeric: true,
      },
      {
        label: this.i18n.t('equipmentAssigned'),
        value: this.i18n.formatInteger(this.store.equipmentCountForProject(project.id)),
      },
      {
        label: this.i18n.t('requestsLinked'),
        value: this.i18n.formatInteger(this.store.requestCountForProject(project.name)),
      },
    ];
  }

  protected totalSpend(project: ProjectRecord): number {
    return project.equipmentSpend + project.transportSpend + project.extraSpend;
  }

  /** Spend as a percentage of budget; drives the over-budget warning colour. */
  protected spendPercent(project: ProjectRecord): number {
    return project.budget ? Math.round((this.totalSpend(project) / project.budget) * 100) : 0;
  }

  protected async openCreate(): Promise<void> {
    const blank: ProjectRecord = {
      id: '',
      name: '',
      code: this.store.nextProjectCode(),
      client: '',
      manager: '',
      location: '',
      status: 'Active',
      budget: 0,
      equipmentSpend: 0,
      transportSpend: 0,
      extraSpend: 0,
      progress: 0,
    };

    const result = await this.openDialog({ mode: 'create', project: blank });

    if (result) {
      await this.busy.run('create', () => this.store.createProject(result));
    }
  }

  protected async openEdit(project: ProjectRecord): Promise<void> {
    const result = await this.openDialog({ mode: 'edit', project });

    if (result) {
      await this.busy.run(project.id, () => this.store.updateProject(project.id, result));
    }
  }

  protected async remove(project: ProjectRecord): Promise<void> {
    if (await this.confirmService.confirmDelete(this.i18n.text(project.name))) {
      await this.busy.run(`delete:${project.id}`, () => this.store.deleteProject(project.id));
    }
  }

  private async openDialog(data: ProjectFormData): Promise<ProjectRecord | undefined> {
    const dialogRef = this.dialog.open<ProjectFormDialog, ProjectFormData, ProjectRecord>(
      ProjectFormDialog,
      { data },
    );

    return firstValueFrom(dialogRef.afterClosed());
  }
}
