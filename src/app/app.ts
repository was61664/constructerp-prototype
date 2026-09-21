import { ChangeDetectionStrategy, Component } from '@angular/core';

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
export class App {}
