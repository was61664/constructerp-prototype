import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

/**
 * Replaces `window.confirm()`, which cannot be styled, is not translatable and
 * renders outside the RTL document flow.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="dialogRef.close(false)">
        {{ data.cancelLabel }}
      </button>
      <button mat-raised-button color="warn" type="button" cdkFocusInitial (click)="dialogRef.close(true)">
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  protected readonly dialogRef = inject<MatDialogRef<ConfirmDialog, boolean>>(MatDialogRef);
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
