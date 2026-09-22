import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Shown in place of a table or list when there is nothing to display. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="empty-title">{{ title() }}</p>
    @if (hint()) {
      <p class="empty-hint">{{ hint() }}</p>
    }
  `,
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly hint = input<string>('');
}
