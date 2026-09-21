import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * The white bordered surface every screen is built from.
 *
 * A 1px border and NO shadow, per the design brief: depth comes from the white
 * surface sitting on the light gray canvas, not from decorative elevation.
 */
@Component({
  selector: 'app-section-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (title() || eyebrow()) {
      <header class="card-head">
        <div class="card-head-text">
          @if (eyebrow()) {
            <span class="eyebrow">{{ eyebrow() }}</span>
          }
          @if (title()) {
            <h2>{{ title() }}</h2>
          }
        </div>
        <div class="card-head-actions">
          <ng-content select="[cardActions]" />
        </div>
      </header>
    }
    <div class="card-body" [class.card-body-flush]="flush()">
      <ng-content />
    </div>
  `,
  styleUrl: './section-card.scss',
})
export class SectionCard {
  readonly title = input<string>('');
  readonly eyebrow = input<string>('');
  /**
   * Removes body padding — use when the card holds a full-bleed table.
   * booleanAttribute lets it be written as a bare attribute: `flush`.
   */
  readonly flush = input(false, { transform: booleanAttribute });
}
