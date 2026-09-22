import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { ErpStore } from './core/services/erp-store';
import { Shell } from './layout/shell/shell';

/**
 * Application root. Intentionally thin: all layout lives in Shell and all
 * screens are lazy-loaded routes. (This file was previously a 1,206-line
 * component holding every screen, every translation and every CRUD method.)
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Shell],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly store = inject(ErpStore);

  ngOnInit(): void {
    // Fire and forget: the store records a load failure and keeps its seeded
    // fallback, so a missing API degrades rather than blanking the screen.
    void this.store.load();
  }
}
