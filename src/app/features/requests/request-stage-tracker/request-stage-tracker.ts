import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { REQUEST_STAGES, type RequestStage } from '../../../core/models';
import { I18nService } from '../../../core/services/i18n';

/**
 * Horizontal tracker for the four request stages.
 *
 * Rendered as an ordered list so assistive technology reads it as a sequence,
 * with the current step marked via aria-current.
 */
@Component({
  selector: 'app-request-stage-tracker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="stages">
      @for (step of steps(); track step.stage) {
        <li
          class="stage"
          [class.stage-done]="step.done"
          [class.stage-current]="step.current"
          [attr.aria-current]="step.current ? 'step' : null"
        >
          <span class="stage-marker" aria-hidden="true">{{ i18n.formatInteger(step.index) }}</span>
          <span class="stage-label">{{ i18n.text(step.stage) }}</span>
        </li>
      }
    </ol>
  `,
  styleUrl: './request-stage-tracker.scss',
})
export class RequestStageTracker {
  readonly currentStage = input.required<RequestStage>();

  protected readonly i18n = inject(I18nService);

  protected readonly steps = computed(() => {
    const currentIndex = REQUEST_STAGES.indexOf(this.currentStage());

    return REQUEST_STAGES.map((stage, index) => ({
      stage,
      index: index + 1,
      done: index < currentIndex,
      current: index === currentIndex,
    }));
  });
}
