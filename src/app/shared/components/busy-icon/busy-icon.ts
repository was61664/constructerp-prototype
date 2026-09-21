import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { LucideCog } from '@lucide/angular';

/**
 * The application's single loading indicator: a turning gear, shown in place of
 * a button's own icon while that button's action is in flight.
 *
 * Usage — wrap the idle icon, it is projected when not busy:
 *
 *   <app-busy-icon [busy]="saving()">
 *     <svg lucidePlus size="16" aria-hidden="true"></svg>
 *   </app-busy-icon>
 *
 * The caller is responsible for also setting `disabled` and `aria-busy` on the
 * button — this component only owns the glyph.
 */
@Component({
  selector: 'app-busy-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideCog],
  template: `
    @if (busy()) {
      <svg lucideCog [size]="size()" class="gear" aria-hidden="true"></svg>
    } @else {
      <ng-content />
    }
  `,
  styleUrl: './busy-icon.scss',
})
export class BusyIcon {
  readonly busy = input(false, { transform: booleanAttribute });
  readonly size = input(16);
}
