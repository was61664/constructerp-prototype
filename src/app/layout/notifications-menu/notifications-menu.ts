import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LucideBell } from '@lucide/angular';

import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { NotificationsService, type AppNotification } from '../../core/services/notifications';

@Component({
  selector: 'app-notifications-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatMenuModule, MatTooltipModule, LucideBell],
  templateUrl: './notifications-menu.html',
  styleUrl: './notifications-menu.scss',
})
export class NotificationsMenu {
  private readonly router = inject(Router);
  private readonly store = inject(ErpStore);

  protected readonly i18n = inject(I18nService);
  protected readonly notifications = inject(NotificationsService);

  protected open(notification: AppNotification): void {
    if (notification.selectEquipmentId) {
      this.store.selectEquipment(notification.selectEquipmentId);
    }

    void this.router.navigateByUrl(notification.route);
  }
}
