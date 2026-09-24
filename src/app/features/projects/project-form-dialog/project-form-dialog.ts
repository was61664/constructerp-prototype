import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { I18nService } from '../../../core/services/i18n';
import type { ProjectRecord, ProjectStatus } from '../../../core/models';

export interface ProjectFormData {
  mode: 'create' | 'edit';
  project: ProjectRecord;
}

const PROJECT_STATUSES: readonly ProjectStatus[] = ['Active', 'At Risk', 'Closing'];

@Component({
  selector: 'app-project-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './project-form-dialog.html',
  styleUrl: './project-form-dialog.scss',
})
export class ProjectFormDialog {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly i18n = inject(I18nService);
  protected readonly dialogRef =
    inject<MatDialogRef<ProjectFormDialog, ProjectRecord | undefined>>(MatDialogRef);
  protected readonly data = inject<ProjectFormData>(MAT_DIALOG_DATA);

  protected readonly statuses = PROJECT_STATUSES;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.project.name, Validators.required],
    // Required only when editing. On create the value is blank and the API
    // allocates the code, because only the server can see the soft-deleted
    // rows whose codes are still held by the unique index.
    code: [this.data.project.code, this.data.mode === 'create' ? [] : Validators.required],
    client: [this.data.project.client],
    manager: [this.data.project.manager],
    location: [this.data.project.location],
    status: [this.data.project.status],
    budget: [this.data.project.budget, [Validators.required, Validators.min(0)]],
    // No spend controls: the API sums those from cost entries and refuses them
    // on a project save, so collecting them here only looked like it worked.
    progress: [this.data.project.progress, [Validators.min(0), Validators.max(100)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Spread the original so id (and anything else not on the form)
    // survives the round trip.
    this.dialogRef.close({ ...this.data.project, ...this.form.getRawValue() });
  }
}
