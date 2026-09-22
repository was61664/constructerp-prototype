import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * Below this width, record tables are replaced by a stacked card list.
 *
 * 700px rather than a device breakpoint: it is the point where the widest
 * table (Equipment, eight columns) stops being readable, not the point where
 * "phone" starts. A small tablet in portrait gets the cards too, which is the
 * right call — the tables need roughly 900px to breathe.
 */
const COMPACT_QUERY = '(max-width: 700px)';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly breakpoints = inject(BreakpointObserver);

  private readonly compact = toSignal(this.breakpoints.observe(COMPACT_QUERY), {
    initialValue: { matches: false, breakpoints: {} },
  });

  /**
   * True when list screens should render cards instead of a table.
   *
   * Used with `@if` rather than a CSS `display` swap on purpose: only one of
   * the two layouts is ever in the DOM, so assistive technology does not meet
   * every record twice and the hidden layout costs nothing to render.
   */
  readonly isCompact = computed(() => this.compact().matches);
}
