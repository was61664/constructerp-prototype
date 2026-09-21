import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LucideCheck, LucideX } from '@lucide/angular';

import type { RequestCheck } from '../../../core/models';
import { I18nService } from '../../../core/services/i18n';

/**
 * Read-only view of a request's gate conditions.
 *
 * Pass/fail is conveyed by an icon and text as well as colour, so it does not
 * rely on colour alone.
 */
@Component({
  selector: 'app-request-checklist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideCheck, LucideX],
  template: `
    <ul class="checks">
      @for (check of checks(); track check.label) {
        <li class="check" [class.check-failed]="!check.passed">
          <span class="check-icon" aria-hidden="true">
            @if (check.passed) {
              <svg lucideCheck size="14"></svg>
            } @else {
              <svg lucideX size="14"></svg>
            }
          </span>
          <span class="check-label">{{ i18n.text(check.label) }}</span>
          <span class="visually-hidden">
            {{ check.passed ? i18n.t('readyReview') : i18n.t('attentionQueue') }}
          </span>
        </li>
      }
    </ul>
    <p class="check-summary">{{ summary() }}</p>
  `,
  styleUrl: './request-checklist.scss',
})
export class RequestChecklist {
  readonly checks = input.required<readonly RequestCheck[]>();

  protected readonly i18n = inject(I18nService);

  protected readonly summary = computed(() => {
    const all = this.checks();
    const passed = all.filter((check) => check.passed).length;

    return `${this.i18n.formatInteger(passed)} / ${this.i18n.formatInteger(all.length)}`;
  });
}
