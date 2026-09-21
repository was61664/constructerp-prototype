import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Simulated round-trip for the mock backend, in milliseconds.
 *
 * ------------------------------------------------------------------------
 * DELETE THIS WHEN THE REAL API LANDS. Set it to 0 to remove the delay now.
 * ------------------------------------------------------------------------
 *
 * The prototype persists to localStorage, which returns within a single frame.
 * Without a delay the busy state is real but invisible, so reviewers cannot see
 * how saving will actually feel, and the loading UI cannot be demonstrated or
 * eyeballed. This constant exists purely so the prototype behaves like the
 * eventual HTTP call. It is the ONLY artificial timing in the app.
 */
export const MOCK_LATENCY_MS = 450;

/**
 * The seam between the app and its persistence.
 *
 * Everything that writes goes through here and returns a Promise, so the UI is
 * already written against an asynchronous backend. Swapping localStorage for an
 * HttpClient call means rewriting this class and nothing else — no component
 * and no store method changes shape.
 */
@Injectable({ providedIn: 'root' })
export class ErpGateway {
  private readonly document = inject(DOCUMENT);

  /** Startup read. Synchronous by design: the app cannot render without it. */
  read<T>(key: string, fallback: readonly T[]): T[] {
    const stored = this.storage()?.getItem(key);

    if (!stored) {
      return [...fallback];
    }

    try {
      const parsed: unknown = JSON.parse(stored);

      return Array.isArray(parsed) ? (parsed as T[]) : [...fallback];
    } catch {
      return [...fallback];
    }
  }

  /** Write. Async because the real implementation will be. */
  async commit<T>(key: string, value: readonly T[]): Promise<void> {
    await this.simulateLatency();

    // Quota errors and disabled storage must not take the app down.
    try {
      this.storage()?.setItem(key, JSON.stringify(value));
    } catch {
      // Ignored by design: this is prototype persistence, not a system of record.
    }
  }

  private simulateLatency(): Promise<void> {
    const view = this.document.defaultView;

    // No window (server-side render, or a test without one) means no timer to
    // wait on — resolve straight away rather than hanging.
    if (MOCK_LATENCY_MS <= 0 || !view) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      view.setTimeout(resolve, MOCK_LATENCY_MS);
    });
  }

  private storage(): Storage | undefined {
    try {
      return this.document.defaultView?.localStorage ?? undefined;
    } catch {
      return undefined;
    }
  }
}
