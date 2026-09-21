import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideCheck, LucideMonitor, LucideMoon, LucideSun } from '@lucide/angular';

import { I18nService } from '../../core/services/i18n';
import { ThemeService, THEME_PREFERENCES, type ThemePreference } from '../../core/services/theme';
import type { TranslationKey } from '../../core/i18n/translations';

/**
 * Light / dark / system picker.
 *
 * A menu rather than a cycling button: with three states a single button gives
 * the user no way to see what the current setting is, or that "system" exists
 * at all. The trigger icon shows the RESOLVED theme (what they see), while the
 * menu shows which PREFERENCE is selected — which is the distinction that
 * matters when "System" is active.
 */
@Component({
  selector: 'app-theme-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    LucideCheck,
    LucideMonitor,
    LucideMoon,
    LucideSun,
  ],
  templateUrl: './theme-menu.html',
  styleUrl: './theme-menu.scss',
})
export class ThemeMenu {
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);

  protected readonly preferences = THEME_PREFERENCES;

  private readonly labelKeys: Record<ThemePreference, TranslationKey> = {
    light: 'themeLight',
    dark: 'themeDark',
    system: 'themeSystem',
  };

  protected label(preference: ThemePreference): string {
    return this.i18n.t(this.labelKeys[preference]);
  }
}
