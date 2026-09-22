import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Title block at the top of every screen, with a slot for primary actions. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="header-text">
      <span class="eyebrow">{{ eyebrow() }}</span>
      <h1>{{ title() }}</h1>
      @if (subtitle()) {
        <p class="subtitle">{{ subtitle() }}</p>
      }
    </div>
    <div class="header-actions">
      <ng-content />
    </div>
  `,
  styleUrl: './page-header.scss',
})
export class PageHeader {
  readonly eyebrow = input<string>('');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
