import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { EquipmentRequest, Ownership } from '../../../core/models';
import { I18nService } from '../../../core/services/i18n';

export interface RequestOption {
  id: string;
  name: string;
}

export interface RequestFormData {
  mode: 'create' | 'edit';
  request: EquipmentRequest;
  projects: readonly RequestOption[];
  equipment: readonly RequestOption[];
}

const OWNERSHIPS: readonly Ownership[] = ['Owned', 'External Rental'];

/**
 * Edits a request's details only.
 *
 * There is no status or stage field, deliberately. Status changes exclusively
 * through the workflow actions on the request card, each of which the server
 * guards; stage is derived from status. The prototype's version of this form
 * let the user pick both from dropdowns, which is what made the approval flow
 * decorative.
 */
@Component({
  selector: 'app-request-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
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

  protected readonly form = this.formBuilder.nonNullable.group({
    // Required only when editing. On create the value is blank and the API
    // allocates the code, because only the server can see the soft-deleted
    // rows whose codes are still held by the unique index.
    code: [this.data.request.code, this.data.mode === 'create' ? [] : Validators.required],
    equipmentId: [this.data.request.equipmentId, Validators.required],
    projectId: [this.data.request.projectId],
    ownership: [this.data.request.ownership],
    requestedBy: [this.data.request.requestedBy],
    // Real date inputs, because these are real dates now. The prototype used
    // free text ("Jul 20"), which could not be compared or validated.
    requiredDate: [this.data.request.requiredDate],
    returnDate: [this.data.request.returnDate],
    location: [this.data.request.location],
    purpose: [this.data.request.purpose],
    estimatedCost: [this.data.request.estimatedCost, Validators.min(0)],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    // Caught here as well as server-side, so the user sees it on the field
    // rather than after a round trip.
    if (value.requiredDate && value.returnDate && value.returnDate < value.requiredDate) {
      this.form.controls.returnDate.setErrors({ beforeRequired: true });
      return;
    }

    const equipment = this.data.equipment.find((option) => option.id === value.equipmentId);
    const project = this.data.projects.find((option) => option.id === value.projectId);

    this.dialogRef.close({
      ...this.data.request,
      code: value.code,
      equipmentId: value.equipmentId,
      equipment: equipment?.name ?? '',
      projectId: value.projectId,
      project: project?.name ?? '',
      ownership: value.ownership,
      requestedBy: value.requestedBy,
      requiredDate: value.requiredDate,
      returnDate: value.returnDate,
      location: value.location,
      purpose: value.purpose,
      estimatedCost: Math.max(0, value.estimatedCost),
    });
  }
}
