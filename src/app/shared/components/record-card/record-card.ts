import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One label/value row inside a record card. */
export interface RecordField {
  label: string;
  value: string;
  /** Right-aligns and tabular-figures the value — use for money and counts. */
  numeric?: boolean;
  /** Renders left-to-right and isolated, for identifiers like PRJ-1001. */
  code?: boolean;
}

/**
 * The mobile counterpart of a table row: one record as a self-contained card
 * with labelled fields.
 *
 * A table row on a 375px screen forces sideways panning to read a single
 * record, and the column header — the thing that says what a value means —
 * scrolls out of view. Stacking puts the label next to its own value instead.
 *
 * Slots: `[status]` in the header, `[actions]` in the footer, and default
 * content between the fields and the actions for anything richer (a meter bar,
 * a stage tracker).
 */
@Component({
  selector: 'app-record-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="record-head">
      <div class="record-title">
        <strong>{{ title() }}</strong>
        @if (subtitle()) {
          <span class="record-subtitle" [class.code]="subtitleIsCode()">{{ subtitle() }}</span>
        }
      </div>
      <ng-content select="[cardStatus]" />
    </header>

    @if (fields().length) {
      <dl class="record-fields">
        @for (field of fields(); track field.label) {
          <div>
            <dt>{{ field.label }}</dt>
            <dd [class.text-numeric]="field.numeric" [class.code]="field.code">
              {{ field.value }}
            </dd>
          </div>
        }
      </dl>
    }

    <ng-content />

    <footer class="record-actions">
      <ng-content select="[cardActions]" />
    </footer>
  `,
  styleUrl: './record-card.scss',
})
export class RecordCard {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly subtitleIsCode = input<boolean>(false);
  readonly fields = input<readonly RecordField[]>([]);
}
