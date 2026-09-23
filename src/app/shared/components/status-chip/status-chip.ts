import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusTone = 'success' | 'info' | 'warn' | 'danger' | 'neutral';

/**
 * Maps every status value in the domain onto one of five tones.
 *
 * Keyed on the raw English value rather than the translated label, so the tone
 * is stable across languages.
 */
const STATUS_TONES: Readonly<Record<string, StatusTone>> = {
  // Equipment
  Working: 'success',
  Idle: 'warn',
  'In Transit': 'info',
  'Inspection Due': 'danger',
  'Return Scheduled': 'info',
  // Rentals
  Active: 'success',
  Overdue: 'danger',
  Returned: 'neutral',
  // Projects
  'At Risk': 'warn',
  Closing: 'neutral',
  // Requests
  Draft: 'neutral',
  Submitted: 'info',
  Approved: 'success',
  Received: 'info',
  'Inspection Pending': 'warn',
  'Ready to Use': 'success',
  // Inspections
  Passed: 'success',
  Attention: 'warn',
  'Pending Signature': 'info',
  // Transport
  Scheduled: 'info',
  'Awaiting Approval': 'warn',
  Completed: 'success',
  Cancelled: 'neutral',
};

/**
 * Flat status label. Deliberately not `mat-chip`: Material chips are fully
 * rounded pills, which the brief rules out.
 */
@Component({
  selector: 'app-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="chip" [class]="'tone-' + tone()">{{ label() }}</span>`,
  styleUrl: './status-chip.scss',
})
export class StatusChip {
  /** Raw (untranslated) status, used to pick the tone. */
  readonly status = input.required<string>();
  /** Display text — pass the translated label here. */
  readonly label = input.required<string>();

  protected readonly tone = computed<StatusTone>(() => STATUS_TONES[this.status()] ?? 'neutral');
}
