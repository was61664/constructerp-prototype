import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBoxes,
  LucideBuilding2,
  LucideChartNoAxesCombined,
  LucideCircleDollarSign,
  LucideClipboardCheck,
  LucideClipboardList,
  LucideGauge,
  LucideTruck,
  LucideWarehouse,
} from '@lucide/angular';

import { I18nService } from '../../core/services/i18n';
import { NavigationService } from '../../core/services/navigation';

@Component({
  selector: 'app-sidebar-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideBoxes,
    LucideBuilding2,
    LucideChartNoAxesCombined,
    LucideCircleDollarSign,
    LucideClipboardCheck,
    LucideClipboardList,
    LucideGauge,
    LucideTruck,
    LucideWarehouse,
  ],
  templateUrl: './sidebar-nav.html',
  styleUrl: './sidebar-nav.scss',
})
export class SidebarNav {
  protected readonly i18n = inject(I18nService);
  protected readonly navigation = inject(NavigationService);

  /** Lets the shell close the drawer after navigation on small screens. */
  readonly navigated = output<void>();
}
