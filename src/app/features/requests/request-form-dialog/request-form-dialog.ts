import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import {
  REQUEST_STAGES,
  type EquipmentRequest,
  type Ownership,
  type RequestCheck,
  type RequestStage,
  type RequestStatus,
} from '../../../core/models';
import { I18nService } from '../../../core/services/i18n';

export interface RequestFormData {
  mode: 'create' | 'edit';
  request: EquipmentRequest;
  projectNames: readonly string[];
  equipmentNames: readonly string[];
}

const OWNERSHIPS: readonly Ownership[] = ['Owned', 'External Rental'];

const REQUEST_STATUSES: readonly RequestStatus[] = [
  'Draft',
  'Submitted',
  'Approved',
  'Received',
  'Inspection Pending',
  'Ready to Use',
];

@Component({
  selector: 'app-request-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './request-form-dialog.html',
  styleUrl: './request-form-dialog.scss',
})
export class RequestFormDialog {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly i18n = inject(I18nService);
  protected readonly dialogRef =
    inject<MatDialogRef<RequestFormDialog, EquipmentRequest | undefined>>(MatDialogRef);
  protected readonly data = inject<RequestFormData>(MAT_DIALOG_DATA);

  protected readonly ownerships = OWNERSHIPS;
  protected readonly stages: readonly RequestStage[] = REQUEST_STAGES;
  protected readonly statuses = REQUEST_STATUSES;

  protected readonly form = this.formBuilder.nonNullable.group({
    id: [this.data.request.id, Validators.required],
    equipment: [this.data.request.equipment, Validators.required],
    project: [this.data.request.project],
    ownership: [this.data.request.ownership],
    requestedBy: [this.data.request.requestedBy],
    requiredDate: [this.data.request.requiredDate],
    returnDate: [this.data.request.returnDate],
    location: [this.data.request.location],
    purpose: [this.data.request.purpose],
    estimatedCost: [this.data.request.estimatedCost, Validators.min(0)],
    stage: [this.data.request.stage],
    status: [this.data.request.status],
  });

  /**
   * Checklists are edited outside the FormGroup as plain controls, one per
   * check, because the label set is data rather than a fixed schema.
   */
  protected readonly checkControls = this.data.request.checks.map((check) => ({
    label: check.label,
    control: new FormControl(check.passed, { nonNullable: true }),
  }));

  protected readonly receivingCheckControls = this.data.request.receivingChecks.map((check) => ({
    label: check.label,
    control: new FormControl(check.passed, { nonNullable: true }),
  }));

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.dialogRef.close({
      ...value,
      estimatedCost: Math.max(0, value.estimatedCost),
      checks: this.readChecks(this.checkControls),
      receivingChecks: this.readChecks(this.receivingCheckControls),
    });
  }

  private readChecks(
    controls: readonly { label: string; control: FormControl<boolean> }[],
  ): RequestCheck[] {
    return controls.map(({ label, control }) => ({ label, passed: control.value }));
  }
}
