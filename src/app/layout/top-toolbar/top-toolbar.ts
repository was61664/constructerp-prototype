import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideBell, LucideMenu, LucideMoon, LucidePlus, LucideSearch, LucideSun } from '@lucide/angular';

import { I18nService } from '../../core/services/i18n';
import { ThemeService } from '../../core/services/theme';

@Component({
  selector: 'app-top-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatToolbarModule,
    MatTooltipModule,
    LucideBell,
    LucideMenu,
    LucideMoon,
    LucidePlus,
    LucideSearch,
    LucideSun,
  ],
  templateUrl: './top-toolbar.html',
  styleUrl: './top-toolbar.scss',
})
export class TopToolbar {
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);

  readonly menuToggled = output<void>();
  readonly newRequestRequested = output<void>();
}
