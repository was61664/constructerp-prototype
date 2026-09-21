import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

/** Outline fields everywhere — filled fields read as a later Material era. */
const formFieldDefaults = { appearance: 'outline' } as const;

const dialogDefaults: MatDialogConfig = {
  width: '560px',
  maxWidth: '94vw',
  autoFocus: 'first-tabbable',
  restoreFocus: true,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      // Each screen should start at the top, not at the previous scroll offset.
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideAnimationsAsync(),
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'KWD' },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: formFieldDefaults },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: dialogDefaults },
  ],
};
