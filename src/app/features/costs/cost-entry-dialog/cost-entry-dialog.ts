import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { CostCategory } from '../../../core/models';
import { I18nService } from '../../../core/services/i18n';

export interface CostEntryFormData {
  projectId: string;
  projectName: string;
}

export interface CostEntryFormResult {
  category: CostCategory;
  amount: number;
  incurredOn: string;
  description: string;
}

const CATEGORIES: readonly CostCategory[] = ['Equipment', 'Transport', 'Extras'];

/**
 * Records one line of spend against a project.
 *
 * The project is fixed by the card the dialog was opened from, so it is shown
 * rather than chosen — an entry with no project is not a thing the API accepts.
 */
@Component({
  selector: 'app-cost-entry-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './cost-entry-dialog.html',
  styleUrl: './cost-entry-dialog.scss',
})
export class CostEntryDialog {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly i18n = inject(I18nService);
  protected readonly dialogRef =
    inject<MatDialogRef<CostEntryDialog, CostEntryFormResult | undefined>>(MatDialogRef);
  protected readonly data = inject<CostEntryFormData>(MAT_DIALOG_DATA);

  protected readonly categories = CATEGORIES;

  protected readonly form = this.formBuilder.nonNullable.group({
    category: ['Equipment' as CostCategory, Validators.required],
    // Three decimals: KWD has 1000 fils to the dinar, and the column stores
    // decimal(18,3). A step of 0.01 would make the last digit unreachable.
    amount: [0, [Validators.required, Validators.min(0)]],
    incurredOn: [new Date().toISOString().slice(0, 10), Validators.required],
    description: [''],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }
}
