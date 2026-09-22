import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { I18nService } from '../../core/services/i18n';
import { ConfirmDialog, type ConfirmDialogData } from '../components/confirm-dialog/confirm-dialog';

/** Opens the translated confirm dialog. Used by every destructive action. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);
  private readonly i18n = inject(I18nService);

  async confirmDelete(recordName: string): Promise<boolean> {
    const data: ConfirmDialogData = {
      title: this.i18n.t('confirmDeleteTitle'),
      message: this.i18n.format('confirmDeleteMessage', { name: recordName }),
      confirmLabel: this.i18n.t('delete'),
      cancelLabel: this.i18n.t('cancel'),
    };

    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data,
      width: '420px',
    });

    return (await firstValueFrom(dialogRef.afterClosed())) ?? false;
  }
}
