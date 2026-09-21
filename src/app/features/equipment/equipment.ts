import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import type { Equipment } from '../../core/models';
import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { MeterBar } from '../../shared/components/meter-bar/meter-bar';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SectionCard } from '../../shared/components/section-card/section-card';
import { StatusChip } from '../../shared/components/status-chip/status-chip';
import { ConfirmService } from '../../shared/services/confirm';
import {
  EquipmentFormDialog,
  type EquipmentFormData,
} from './equipment-form-dialog/equipment-form-dialog';

/**
 * Named `EquipmentPage` rather than `Equipment` because `Equipment` is the
 * domain model's name. The file keeps the repo's suffix-less convention.
 */
@Component({
  selector: 'app-equipment',
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
  templateUrl: './equipment.html',
  styleUrl: './equipment.scss',
})
export class EquipmentPage {
  private readonly dialog = inject(MatDialog);
  private readonly confirmService = inject(ConfirmService);

  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);

  protected readonly columns = [
    'name',
    'type',
    'ownership',
    'project',
    'status',
    'utilization',
    'dailyCost',
    'actions',
  ] as const;

  private readonly projectNames = computed(() =>
    this.store.projects().map((project) => project.name),
  );

  protected select(item: Equipment): void {
    this.store.selectEquipment(item.id);
  }

  protected async openCreate(): Promise<void> {
    const blank: Equipment = {
      id: this.store.nextEquipmentId(),
      name: '',
      type: '',
      ownership: 'Owned',
      project: this.projectNames()[0] ?? '',
      status: 'Working',
      utilization: 0,
      dailyCost: 0,
      nextAction: '',
    };

    const result = await this.openDialog({
      mode: 'create',
      equipment: blank,
      projectNames: this.projectNames(),
    });

    if (result) {
      this.store.createEquipment(result);
    }
  }

  protected async openEdit(item: Equipment): Promise<void> {
    const result = await this.openDialog({
      mode: 'edit',
      equipment: item,
      projectNames: this.projectNames(),
    });

    if (result) {
      this.store.updateEquipment(item.id, result);
    }
  }

  protected async remove(item: Equipment): Promise<void> {
    if (await this.confirmService.confirmDelete(this.i18n.text(item.name))) {
      this.store.deleteEquipment(item.id);
    }
  }

  private async openDialog(data: EquipmentFormData): Promise<Equipment | undefined> {
    const dialogRef = this.dialog.open<EquipmentFormDialog, EquipmentFormData, Equipment>(
      EquipmentFormDialog,
      { data },
    );

    return firstValueFrom(dialogRef.afterClosed());
  }
}
