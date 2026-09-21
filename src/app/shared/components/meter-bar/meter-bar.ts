import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Labelled percentage bar used for utilization and cost progress.
 *
 * Built on a plain div rather than mat-progress-bar so the fill colour can
 * carry meaning (over-budget turns red) without fighting Material's theme.
 * Exposes progressbar semantics for screen readers.
 */
@Component({
  selector: 'app-meter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="meter-head">
      <span class="meter-label">{{ label() }}</span>
      <span class="meter-value text-numeric">{{ valueLabel() }}</span>
    </div>
    <div
      class="meter-track"
      role="progressbar"
      [attr.aria-label]="label()"
      [attr.aria-valuenow]="value()"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuetext]="valueLabel()"
    >
      <div class="meter-fill" [class]="'tone-' + tone()" [style.inline-size.%]="clamped()"></div>
    </div>
  `,
  styleUrl: './meter-bar.scss',
})
export class MeterBar {
  readonly label = input.required<string>();
  /** Percentage, 0-100. */
  readonly value = input.required<number>();
  /** Preformatted display value — keeps locale formatting in the caller. */
  readonly valueLabel = input.required<string>();
  /** Above this, the bar turns red to flag overrun. */
  readonly dangerAbove = input<number>(100);

  protected readonly clamped = computed(() => Math.min(100, Math.max(0, this.value())));

  protected readonly tone = computed(() => {
    const value = this.value();

    if (value > this.dangerAbove()) {
      return 'danger';
    }

    return value >= 80 ? 'strong' : 'normal';
  });
}
