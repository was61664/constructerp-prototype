import { signal } from '@angular/core';

/**
 * Tracks which single action is in flight, so exactly one button shows its
 * gear rather than every button on the screen spinning at once.
 *
 * A plain class, instantiated per component — this is view state, not something
 * to share through the injector.
 */
export class BusyState {
  private readonly active = signal<string | null>(null);

  /** True while this specific action is running. */
  is(key: string): boolean {
    return this.active() === key;
  }

  /** True while ANY action is running — use it to disable competing buttons. */
  get any(): boolean {
    return this.active() !== null;
  }

  async run<T>(key: string, work: () => Promise<T>): Promise<T> {
    this.active.set(key);

    try {
      return await work();
    } finally {
      // `finally` matters: a rejected save must not leave the gear turning
      // forever with the whole screen disabled.
      this.active.set(null);
    }
  }
}
