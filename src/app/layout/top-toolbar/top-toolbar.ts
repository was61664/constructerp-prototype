import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { LucideLogOut, LucideMenu, LucidePlus, LucideUser } from '@lucide/angular';

import { AuthService } from '../../core/services/auth';
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
    MatMenuModule,
    MatToolbarModule,
    NotificationsMenu,
    ThemeMenu,
    LucideLogOut,
    LucideMenu,
    LucidePlus,
    LucideUser,
  ],
  templateUrl: './top-toolbar.html',
  styleUrl: './top-toolbar.scss',
})
export class TopToolbar {
  private readonly router = inject(Router);

  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthService);

  readonly menuToggled = output<void>();
  readonly newRequestRequested = output<void>();

  /**
   * "New request" belongs to whoever operates the request workflow, which is
   * nobody outside the internal roles yet. Hiding it is cosmetic — the API
   * refuses the call either way.
   */
  protected get canCreateRequests(): boolean {
    return this.auth.canReach('requests');
  }

  protected async signOut(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
