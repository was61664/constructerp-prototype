import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type {
  Equipment,
  EquipmentStatus,
  EquipmentTypeOption,
  Ownership,
} from '../../../core/models';
import { I18nService } from '../../../core/services/i18n';

export interface EquipmentProjectOption {
  id: string;
  name: string;
}

export interface EquipmentFormData {
  mode: 'create' | 'edit';
  equipment: Equipment;
  projects: readonly EquipmentProjectOption[];
  types: readonly EquipmentTypeOption[];
}

const OWNERSHIPS: readonly Ownership[] = ['Owned', 'External Rental'];

const EQUIPMENT_STATUSES: readonly EquipmentStatus[] = [
  'Working',
  'Idle',
  'In Transit',
  'Inspection Due',
  'Return Scheduled',
];

@Component({
  selector: 'app-equipment-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './equipment-form-dialog.html',
  styleUrl: './equipment-form-dialog.scss',
})
export class EquipmentFormDialog {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly i18n = inject(I18nService);
  protected readonly dialogRef =
    inject<MatDialogRef<EquipmentFormDialog, Equipment | undefined>>(MatDialogRef);
  protected readonly data = inject<EquipmentFormData>(MAT_DIALOG_DATA);

  protected readonly ownerships = OWNERSHIPS;
  protected readonly statuses = EQUIPMENT_STATUSES;

  protected readonly form = this.formBuilder.nonNullable.group({
    // Required only when editing. On create the value is blank and the API
    // allocates the code, because only the server can see the soft-deleted
    // rows whose codes are still held by the unique index.
    code: [this.data.equipment.code, this.data.mode === 'create' ? [] : Validators.required],
    name: [this.data.equipment.name, Validators.required],
    equipmentTypeId: [this.data.equipment.equipmentTypeId, Validators.required],
    ownership: [this.data.equipment.ownership],
    // Nullable: an asset can sit in the yard unassigned.
    projectId: [this.data.equipment.projectId],
    status: [this.data.equipment.status],
    utilization: [this.data.equipment.utilization, [Validators.min(0), Validators.max(100)]],
    dailyCost: [this.data.equipment.dailyCost, Validators.min(0)],
    nextAction: [this.data.equipment.nextAction],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const project = this.data.projects.find((option) => option.id === value.projectId);
    const type = this.data.types.find((option) => option.id === value.equipmentTypeId);

    this.dialogRef.close({
      ...this.data.equipment,
      code: value.code,
      name: value.name,
      equipmentTypeId: value.equipmentTypeId,
      type: type?.name ?? '',
      ownership: value.ownership,
      projectId: value.projectId,
      project: project?.name ?? '',
      status: value.status,
      // Clamp rather than reject: a typed 120% is an obvious slip, not a
      // reason to block the save.
      utilization: Math.min(100, Math.max(0, Math.round(value.utilization))),
      dailyCost: Math.max(0, value.dailyCost),
      nextAction: value.nextAction,
    });
  }
}
