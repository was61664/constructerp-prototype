import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideSearch, LucideX } from '@lucide/angular';

import { ErpStore } from '../../core/services/erp-store';
import { I18nService } from '../../core/services/i18n';
import { SearchService, type SearchResult } from '../../core/services/search';

/**
 * Global search in the toolbar.
 *
 * Implemented as a combobox: the input keeps focus and owns the keyboard, while
 * the results panel is a listbox the arrow keys move through. Results are
 * buttons so they are reachable by Tab as well, for anyone not using arrows.
 */
@Component({
  selector: 'app-global-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideSearch, LucideX],
  templateUrl: './global-search.html',
  styleUrl: './global-search.scss',
})
export class GlobalSearch {
  private readonly router = inject(Router);
  private readonly store = inject(ErpStore);

  protected readonly i18n = inject(I18nService);
  protected readonly search = inject(SearchService);

  private readonly input = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly open = signal(false);
  /** -1 means "no result highlighted"; the input itself holds focus. */
  protected readonly activeIndex = signal(-1);

  protected readonly showPanel = computed(() => this.open() && this.search.hasQuery());

  protected readonly activeKey = computed(() => {
    const results = this.search.flatResults();
    const index = this.activeIndex();

    return index >= 0 && index < results.length ? results[index].key : null;
  });

  protected onInput(value: string): void {
    this.search.query.set(value);
    this.open.set(true);
    this.activeIndex.set(-1);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const results = this.search.flatResults();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open.set(true);
        this.move(1, results.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1, results.length);
        break;
      case 'Enter': {
        const index = this.activeIndex();

        if (index >= 0 && index < results.length) {
          event.preventDefault();
          this.go(results[index]);
        }
        break;
      }
      case 'Escape':
        // First Escape closes the panel, a second clears the query — the
        // behaviour people expect from a search field.
        if (this.showPanel()) {
          this.open.set(false);
        } else {
          this.clear();
        }
        break;
      default:
        break;
    }
  }

  protected go(result: SearchResult): void {
    if (result.selectEquipmentId) {
      this.store.selectEquipment(result.selectEquipmentId);
    }

    this.open.set(false);
    this.search.clear();
    void this.router.navigateByUrl(result.route);
  }

  protected clear(): void {
    this.search.clear();
    this.open.set(false);
    this.activeIndex.set(-1);
    this.input()?.nativeElement.focus();
  }

  /** Blur closes the panel, but only after a click on a result has landed. */
  protected onBlur(): void {
    setTimeout(() => this.open.set(false), 120);
  }

  private move(delta: number, length: number): void {
    if (!length) {
      return;
    }

    this.activeIndex.update((current) => {
      const next = current + delta;

      // Wraps at both ends so the list is a loop, not a dead end.
      if (next < 0) {
        return length - 1;
      }

      return next >= length ? 0 : next;
    });
  }
}
