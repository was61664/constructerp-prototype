import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

/** What the user asked for. `system` defers to the operating system. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** What is actually painted. `system` has been resolved away. */
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'constructerp.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

/**
 * Light / dark / system theme state.
 *
 * Two distinct pieces of state, deliberately kept apart:
 *
 *   preference — what the user chose, including "system". Persisted.
 *   resolved   — what actually gets painted. Never persisted.
 *
 * Collapsing the two is the classic bug in this feature: if you store the
 * resolved value, the first visit silently freezes whatever the OS happened to
 * say at that moment, and the app stops following the OS forever after — even
 * though the user never made a choice.
 *
 * Storage is therefore written only on an explicit `select()`, never from the
 * effect that applies the class.
 *
 * Shaped like I18nService (signal + effect + guarded localStorage) so the two
 * pieces of global UI state behave the same way.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  /** Tracks the OS setting live, so `system` keeps following it after load. */
  private readonly systemPrefersDark = signal(this.readSystemPrefersDark());

  readonly preference = signal<ThemePreference>(this.readStoredPreference());

  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this.preference();

    if (preference !== 'system') {
      return preference;
    }

    return this.systemPrefersDark() ? 'dark' : 'light';
  });

  readonly isDark = computed(() => this.resolved() === 'dark');

  constructor() {
    this.watchSystemPreference();

    // Applies the theme. Note there is no persistence here — see the class
    // comment; writing storage from this effect is what breaks `system`.
    effect(() => {
      const resolved = this.resolved();
      const classes = this.document.documentElement.classList;

      classes.toggle('theme-dark', resolved === 'dark');
      classes.toggle('theme-light', resolved === 'light');
    });
  }

  /** Explicit user choice. This — and only this — is persisted. */
  select(preference: ThemePreference): void {
    this.preference.set(preference);
    this.persist(preference);
  }

  /** Cycles light → dark → system, for a single-button control. */
  cycle(): void {
    const next = this.preference() === 'light' ? 'dark' : this.preference() === 'dark' ? 'system' : 'light';

    this.select(next);
  }

  private watchSystemPreference(): void {
    const query = this.document.defaultView?.matchMedia?.(DARK_QUERY);

    // addEventListener is unavailable on Safari < 14's MediaQueryList; the
    // optional call degrades to "system resolves once at load" there rather
    // than throwing.
    query?.addEventListener?.('change', (event) => this.systemPrefersDark.set(event.matches));
  }

  private readSystemPrefersDark(): boolean {
    return this.document.defaultView?.matchMedia?.(DARK_QUERY).matches ?? false;
  }

  private readStoredPreference(): ThemePreference {
    try {
      const stored = this.document.defaultView?.localStorage?.getItem(THEME_STORAGE_KEY);

      return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'system';
    } catch {
      return 'system';
    }
  }

  private persist(preference: ThemePreference): void {
    // Storage throws in private-browsing modes; a theme preference is not
    // worth breaking the app over.
    try {
      this.document.defaultView?.localStorage?.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Ignored by design.
    }
  }
}
