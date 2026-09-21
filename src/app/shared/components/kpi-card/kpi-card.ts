import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Dashboard metric tile: label, large value, supporting note. */
@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="kpi-label">{{ label() }}</span>
    <strong class="kpi-value text-numeric">{{ value() }}</strong>
    @if (note()) {
      <span class="kpi-note">{{ note() }}</span>
    }
  `,
  styleUrl: './kpi-card.scss',
})
export class KpiCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly note = input<string>('');
}
