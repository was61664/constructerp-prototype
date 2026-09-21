import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideBell, LucideMenu, LucidePlus, LucideSearch } from '@lucide/angular';

import { I18nService } from '../../core/services/i18n';
import { ThemeMenu } from '../theme-menu/theme-menu';

@Component({
  selector: 'app-top-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatToolbarModule,
    MatTooltipModule,
    ThemeMenu,
    LucideBell,
    LucideMenu,
    LucidePlus,
    LucideSearch,
  ],
  templateUrl: './top-toolbar.html',
  styleUrl: './top-toolbar.scss',
})
export class TopToolbar {
  protected readonly i18n = inject(I18nService);

  readonly menuToggled = output<void>();
  readonly newRequestRequested = output<void>();
}
