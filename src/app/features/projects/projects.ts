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
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { MeterBar } from '../../shared/components/meter-bar/meter-bar';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';
import { ConfirmService } from '../../shared/services/confirm';
import {
  ProjectFormDialog,
  type ProjectFormData,
} from './project-form-dialog/project-form-dialog';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyState,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MeterBar,
    PageHeader,
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

  protected totalSpend(project: ProjectRecord): number {
    return project.equipmentSpend + project.transportSpend + project.extraSpend;
  }

  /** Spend as a percentage of budget; drives the over-budget warning colour. */
  protected spendPercent(project: ProjectRecord): number {
    return project.budget ? Math.round((this.totalSpend(project) / project.budget) * 100) : 0;
  }

  protected async openCreate(): Promise<void> {
    const blank: ProjectRecord = {
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
      this.store.createProject(result);
    }
  }

  protected async openEdit(project: ProjectRecord): Promise<void> {
    const result = await this.openDialog({ mode: 'edit', project });

    if (result) {
      this.store.updateProject(project.code, result);
    }
  }

  protected async remove(project: ProjectRecord): Promise<void> {
    if (await this.confirmService.confirmDelete(this.i18n.text(project.name))) {
      this.store.deleteProject(project.code);
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
