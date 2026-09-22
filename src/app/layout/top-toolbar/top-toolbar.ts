import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LucideMenu, LucidePlus } from '@lucide/angular';

import { I18nService } from '../../core/services/i18n';
import { GlobalSearch } from '../global-search/global-search';
import { NotificationsMenu } from '../notifications-menu/notifications-menu';
import { ThemeMenu } from '../theme-menu/theme-menu';

@Component({
  selector: 'app-top-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GlobalSearch,
    MatButtonModule,
    MatToolbarModule,
    NotificationsMenu,
    ThemeMenu,
    LucideMenu,
    LucidePlus,
  ],
  templateUrl: './top-toolbar.html',
  styleUrl: './top-toolbar.scss',
})
export class TopToolbar {
  protected readonly i18n = inject(I18nService);

  readonly menuToggled = output<void>();
  readonly newRequestRequested = output<void>();
}
