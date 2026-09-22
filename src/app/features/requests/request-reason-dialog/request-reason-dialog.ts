import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import type { TranslationKey } from '../../../core/i18n/translations';
import { I18nService } from '../../../core/services/i18n';

export interface RequestReasonData {
  titleKey: TranslationKey;
  messageKey: TranslationKey;
  requireReason: boolean;
}

export interface RequestReasonResult {
  reason: string;
}

/**
 * Collects the explanation the workflow requires.
 *
 * Used for rejection and for a failed inspection. The API refuses both without
 * a reason, so the field is required here too — better to block at the form
 * than to round-trip for a 400.
 */
@Component({
  selector: 'app-request-reason-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ i18n.t(data.titleKey) }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <p class="hint">{{ i18n.t(data.messageKey) }}</p>

        <mat-form-field>
          <mat-label>{{ i18n.t('reason') }}</mat-label>
          <textarea matInput rows="3" formControlName="reason" required></textarea>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button type="button" (click)="dialogRef.close()">
          {{ i18n.t('cancel') }}
        </button>
        <button mat-raised-button color="primary" type="submit">{{ i18n.t('save') }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styleUrl: './request-reason-dialog.scss',
})
export class RequestReasonDialog {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly i18n = inject(I18nService);
  protected readonly dialogRef =
    inject<MatDialogRef<RequestReasonDialog, RequestReasonResult | undefined>>(MatDialogRef);
  protected readonly data = inject<RequestReasonData>(MAT_DIALOG_DATA);

  protected readonly form = this.formBuilder.nonNullable.group({
    reason: ['', this.data.requireReason ? [Validators.required] : []],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({ reason: this.form.getRawValue().reason.trim() });
  }
}
