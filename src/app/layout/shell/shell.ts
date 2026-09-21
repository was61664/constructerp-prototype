import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterOutlet } from '@angular/router';

import { I18nService } from '../../core/services/i18n';
import { SidebarNav } from '../sidebar-nav/sidebar-nav';
import { TopToolbar } from '../top-toolbar/top-toolbar';

/** Below this width the fixed sidebar becomes an overlay drawer. */
const WIDE_LAYOUT = '(min-width: 1024px)';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSidenavModule, RouterOutlet, SidebarNav, TopToolbar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly router = inject(Router);

  protected readonly i18n = inject(I18nService);

  private readonly isWide = toSignal(this.breakpoints.observe(WIDE_LAYOUT), {
    initialValue: { matches: true, breakpoints: {} },
  });

  protected readonly drawerMode = computed<'side' | 'over'>(() =>
    this.isWide().matches ? 'side' : 'over',
  );

  protected readonly drawerOpen = signal(true);

  constructor() {
    // Pinned open on wide screens, closed by default once it becomes an
    // overlay so it never covers the content on load.
    effect(() => this.drawerOpen.set(this.isWide().matches));
  }

  protected toggleDrawer(): void {
    this.drawerOpen.update((open) => !open);
  }

  /** Closing after navigation only matters while the drawer is an overlay. */
  protected closeDrawerIfOverlay(): void {
    if (this.drawerMode() === 'over') {
      this.drawerOpen.set(false);
    }
  }

  /**
   * The toolbar owns the primary action, but the dialog belongs to the requests
   * feature. Routing with a query param keeps the dependency pointing one way
   * (the feature owns its own dialog) and makes the action linkable.
   */
  protected openNewRequest(): void {
    void this.router.navigate(['/requests'], { queryParams: { new: 1 } });
  }
}
