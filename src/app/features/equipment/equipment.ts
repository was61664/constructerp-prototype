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
  templateUrl: './equipment.html',
  styleUrl: './equipment.scss',
})
export class EquipmentPage {
  private readonly dialog = inject(MatDialog);
  private readonly confirmService = inject(ConfirmService);

  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ErpStore);
  protected readonly layout = inject(LayoutService);

  /** Which button is mid-save, so only that one turns its gear. */
  protected readonly busy = new BusyState();

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

  /** Options for the project and type selects in the form dialog. */
  private readonly formOptions = computed(() => ({
    projects: this.store.projects().map((project) => ({ id: project.id, name: project.name })),
    types: this.store.equipmentTypes(),
  }));

  protected fieldsFor(item: Equipment): RecordField[] {
    return [
      { label: this.i18n.t('type'), value: this.i18n.text(item.type) },
      { label: this.i18n.t('ownership'), value: this.i18n.text(item.ownership) },
      { label: this.i18n.t('project'), value: this.i18n.text(item.project) },
      // Utilization is deliberately absent: the meter bar below the fields
      // already shows it, with a bar as well as the number.
      {
        label: this.i18n.t('dailyCost'),
        value: this.i18n.formatMoney(item.dailyCost),
        numeric: true,
      },
      { label: this.i18n.t('nextAction'), value: this.i18n.text(item.nextAction) },
    ];
  }

  protected select(item: Equipment): void {
    this.store.selectEquipment(item.id);
  }

  protected async openCreate(): Promise<void> {
    const blank: Equipment = {
      id: '',
      code: this.store.nextEquipmentCode(),
      name: '',
      equipmentTypeId: this.store.equipmentTypes()[0]?.id ?? '',
      type: '',
      ownership: 'Owned',
      projectId: this.store.projects()[0]?.id ?? null,
      project: '',
      status: 'Working',
      utilization: 0,
      dailyCost: 0,
      nextAction: '',
    };

    const result = await this.openDialog({
      mode: 'create',
      equipment: blank,
      ...this.formOptions(),
    });

    if (result) {
      await this.busy.run('create', () => this.store.createEquipment(result));
    }
  }

  protected async openEdit(item: Equipment): Promise<void> {
    const result = await this.openDialog({ mode: 'edit', equipment: item, ...this.formOptions() });

    if (result) {
      await this.busy.run(item.id, () => this.store.updateEquipment(item.id, result));
    }
  }

  protected async remove(item: Equipment): Promise<void> {
    if (await this.confirmService.confirmDelete(this.i18n.text(item.name))) {
      await this.busy.run(`delete:${item.id}`, () => this.store.deleteEquipment(item.id));
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
