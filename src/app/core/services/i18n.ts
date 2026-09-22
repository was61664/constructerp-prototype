import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { arabicDigitMap, dataLabels } from '../i18n/data-labels';
import {
  moduleLabels,
  navGroupLabels,
  translations,
  type Language,
  type TranslationKey,
} from '../i18n/translations';
import type { ModuleId, NavGroupId } from '../models';

const LANGUAGE_STORAGE_KEY = 'constructerp.language';

/**
 * Language state plus every locale-sensitive formatter.
 *
 * `t()`, `text()` and the formatters all read the `language` signal, so calling
 * them from a template automatically re-renders that binding on language
 * change — no pipe and no manual change detection needed, even under OnPush.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly directionality = inject(Directionality);

  readonly language = signal<Language>(this.readStoredLanguage());

  readonly isArabic = computed(() => this.language() === 'ar');
  readonly direction = computed<'rtl' | 'ltr'>(() => (this.isArabic() ? 'rtl' : 'ltr'));

  private readonly currencyLocale = computed(() => (this.isArabic() ? 'ar-KW' : 'en-KW'));
  private readonly numberLocale = computed(() => (this.isArabic() ? 'ar-KW' : 'en-US'));

  constructor() {
    // Direction and lang belong on the document element so that Material
    // overlays (dialogs, menus) — which render outside the app root — also
    // pick up RTL.
    effect(() => {
      const language = this.language();
      const direction = this.direction();

      this.document.documentElement.lang = language;
      this.document.documentElement.dir = direction;
      this.document.body.dir = direction;

      // CDK reads the document direction ONCE, at service construction. Without
      // this push, Material keeps its start-up direction: the sidenav reserves
      // its margin on the wrong side (content slides under the drawer) and
      // dialogs open with an explicit dir="ltr" that overrides the document.
      this.directionality.valueSignal.set(direction);
      this.directionality.change.emit(direction);

      this.persistLanguage(language);
    });
  }

  toggleLanguage(): void {
    this.language.update((language) => (language === 'en' ? 'ar' : 'en'));
  }

  /** UI chrome string by key. */
  t(key: TranslationKey): string {
    return this.localizeDigits(translations[this.language()][key]);
  }

  /** UI string with `{name}`-style placeholders filled in. */
  format(key: TranslationKey, values: Record<string, string>): string {
    return Object.entries(values).reduce(
      (result, [token, value]) => result.replaceAll(`{${token}}`, value),
      this.t(key),
    );
  }

  /** Data value (status, project name, vendor). Falls back to the raw value. */
  text(value: string): string {
    return this.localizeDigits(dataLabels[this.language()][value] ?? value);
  }

  /**
   * Every known label for a data value, across ALL languages.
   *
   * `text()` resolves to the active language only, which is right for display
   * but wrong for search: on a bilingual site an Arabic speaker types Arabic
   * whether or not the interface is currently in Arabic. Matching on every
   * variant makes search work in either language, in either UI.
   */
  labelVariants(value: string): string[] {
    const arabic = dataLabels.ar[value];

    return arabic ? [value, arabic] : [value];
  }

  /**
   * Record identifiers (PRJ-1001, EQ-104, REQ-2407) are returned untouched.
   *
   * They are codes, not quantities: converting their digits to Arabic-Indic
   * makes the bidi algorithm reorder the run, so "PRJ-1001" displays as
   * "١٠٠١-PRJ". Pair this with the `.code` class, which isolates the span.
   */
  code(value: string): string {
    return value;
  }

  moduleLabel(id: ModuleId): { label: string; caption: string } {
    return moduleLabels[this.language()][id];
  }

  navGroupLabel(id: NavGroupId): string {
    return navGroupLabels[this.language()][id];
  }

  formatInteger(value: number): string {
    return new Intl.NumberFormat(this.numberLocale(), { maximumFractionDigits: 0 }).format(value);
  }

  /** KWD carries three decimal places, so fractions are not truncated to two. */
  formatMoney(value: number): string {
    return new Intl.NumberFormat(this.currencyLocale(), {
      style: 'currency',
      currency: 'KWD',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(value);
  }

  formatPercent(value: number): string {
    return `${this.formatInteger(value)}%`;
  }

  /**
   * Mock dates are stored as display strings ("Jul 20"), so this parses that
   * shape rather than a real Date. Replace with Intl.DateTimeFormat once the
   * API returns real dates — see PROJECT_GUIDE.md §6.4.
   */
  formatDateLabel(value: string): string {
    if (!this.isArabic()) {
      return value;
    }

    const match = /^(Jul)\s+(\d{1,2})$/.exec(value);

    return match ? `${this.localizeDigits(match[2])} يوليو` : this.localizeDigits(value);
  }

  private localizeDigits(value: string): string {
    if (!this.isArabic()) {
      return value;
    }

    return value.replace(/\d/g, (digit) => arabicDigitMap[digit] ?? digit);
  }

  private readStoredLanguage(): Language {
    const stored = this.document.defaultView?.localStorage?.getItem(LANGUAGE_STORAGE_KEY);

    return stored === 'ar' || stored === 'en' ? stored : 'en';
  }

  private persistLanguage(language: Language): void {
    // Storage throws in private-browsing modes; the language choice is not
    // important enough to break the app over.
    try {
      this.document.defaultView?.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignored by design.
    }
  }
}
