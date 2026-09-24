import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Application root. Intentionally thin: it renders whichever route matched —
 * the login form, or the Shell layout with a module inside it. (This file was
 * previously a 1,206-line component holding every screen, every translation
 * and every CRUD method.)
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
