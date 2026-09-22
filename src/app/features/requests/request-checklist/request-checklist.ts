import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LucideCheck, LucideX } from '@lucide/angular';

import type { RequestCheck } from '../../../core/models';
import { I18nService } from '../../../core/services/i18n';

export interface CheckToggle {
  id: string;
  passed: boolean;
}

/**
 * A request's gate conditions.
 *
 * Interactive while the gate is still open, read-only once the request has
 * passed through it — the server enforces the same rule, because ticking a
 * check after a decision was made would rewrite the record of why.
 *
 * Pass/fail is shown with an icon and text as well as colour, so it does not
 * depend on colour alone.
 */
@Component({
  selector: 'app-request-checklist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCheckboxModule, LucideCheck, LucideX],
  template: `
    <ul class="checks">
      @for (check of checks(); track check.id) {
        <li class="check" [class.check-failed]="!check.passed">
          @if (editable()) {
            <mat-checkbox
              color="primary"
              [checked]="check.passed"
              [disabled]="busy()"
              (change)="toggled.emit({ id: check.id, passed: $event.checked })"
            >
              {{ check.label }}
            </mat-checkbox>
          } @else {
            <span class="check-icon" aria-hidden="true">
              @if (check.passed) {
                <svg lucideCheck size="14"></svg>
              } @else {
                <svg lucideX size="14"></svg>
              }
            </span>
            <span class="check-label">{{ check.label }}</span>
          }
        </li>
      }
    </ul>
    <p class="check-summary">{{ summary() }}</p>
  `,
  styleUrl: './request-checklist.scss',
})
export class RequestChecklist {
  readonly checks = input.required<readonly RequestCheck[]>();
  /** Whether this gate can still be changed. */
  readonly editable = input(false);
  readonly busy = input(false);

  readonly toggled = output<CheckToggle>();

  protected readonly i18n = inject(I18nService);

  protected readonly summary = computed(() => {
    const all = this.checks();
    const passed = all.filter((check) => check.passed).length;

    return `${this.i18n.formatInteger(passed)} / ${this.i18n.formatInteger(all.length)}`;
  });
}
