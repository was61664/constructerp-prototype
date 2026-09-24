import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { LocalizedTextDto } from '../data/api-contracts';
import type { CurrentUser, UserRole } from '../models';
import { canReach } from '../models';

interface AuthResultDto {
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    organizationId: string | null;
    organizationName: LocalizedTextDto | null;
  };
}

/** Survives a page reload; see the note on storage below. */
const STORAGE_KEY = 'constructerp.session';

/**
 * Sign-in state and the tokens that back it.
 *
 * **On storage:** the refresh token is kept in `localStorage`, which is
 * readable by any script on the origin — so any XSS becomes a stolen session.
 * The safer shape is an httpOnly cookie, which script cannot read at all. That
 * needs the API to set cookies cross-origin, which needs SameSite=None with
 * HTTPS and a CSRF token on every mutation. Worth doing before this faces the
 * internet; not worth blocking the first auth slice on. The mitigations that
 * do apply today are already in place: tokens are short-lived, refresh tokens
 * rotate on use, and logout revokes server-side.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  private readonly baseUrl = environment.apiBaseUrl;

  private readonly accessToken = signal<string | null>(null);
  private readonly refreshToken = signal<string | null>(null);
  private readonly userSignal = signal<CurrentUser | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly role = computed<UserRole | null>(() => this.userSignal()?.role ?? null);
  readonly isSignedIn = computed(() => this.userSignal() !== null);

  /**
   * True when the app has no API and therefore no login.
   *
   * The GitHub Pages build runs entirely on seed data. Demanding a password
   * there would lock everyone out of a demo that has nothing to protect.
   */
  readonly requiresSignIn = environment.apiBaseUrl.length > 0;

  constructor() {
    this.restore();
  }

  /** The value for the Authorization header, or null when signed out. */
  token(): string | null {
    return this.accessToken();
  }

  canReach(path: string): boolean {
    // No API means no roles; every module is open on the demo build.
    return this.requiresSignIn ? canReach(this.role(), path) : true;
  }

  async login(email: string, password: string): Promise<void> {
    const result = await firstValueFrom(
      this.http.post<AuthResultDto>(`${this.baseUrl}/api/auth/login`, { email, password }),
    );

    this.apply(result);
  }

  /**
   * Swaps the refresh token for a new pair.
   *
   * Returns false rather than throwing when it fails — the caller is an
   * interceptor recovering from a 401, and a rejected refresh means "sign in
   * again", which is a normal outcome rather than an error.
   */
  async refresh(): Promise<boolean> {
    const token = this.refreshToken();

    if (!token) {
      return false;
    }

    try {
      const result = await firstValueFrom(
        this.http.post<AuthResultDto>(`${this.baseUrl}/api/auth/refresh`, {
          refreshToken: token,
        }),
      );

      this.apply(result);

      return true;
    } catch {
      this.clear();

      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      // Revokes the refresh tokens server-side. The access token cannot be
      // recalled, which is why it is short-lived.
      await firstValueFrom(this.http.post(`${this.baseUrl}/api/auth/logout`, null));
    } catch {
      // A failed revoke must not trap the user in a session they asked to end.
    }

    this.clear();
  }

  private apply(result: AuthResultDto): void {
    this.accessToken.set(result.accessToken);
    this.refreshToken.set(result.refreshToken);
    this.userSignal.set({
      id: result.user.id,
      email: result.user.email,
      displayName: result.user.displayName,
      role: result.user.role,
      organizationId: result.user.organizationId,
      organizationName: result.user.organizationName?.en ?? '',
    });

    this.persist();
  }

  clear(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.userSignal.set(null);

    try {
      this.storage()?.removeItem(STORAGE_KEY);
    } catch {
      // Ignored: storage being unavailable must not block signing out.
    }
  }

  private persist(): void {
    try {
      this.storage()?.setItem(
        STORAGE_KEY,
        JSON.stringify({
          accessToken: this.accessToken(),
          refreshToken: this.refreshToken(),
          user: this.userSignal(),
        }),
      );
    } catch {
      // Private browsing and blocked storage: the session simply ends on reload.
    }
  }

  private restore(): void {
    try {
      const stored = this.storage()?.getItem(STORAGE_KEY);

      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as {
        accessToken?: string;
        refreshToken?: string;
        user?: CurrentUser;
      };

      if (!parsed.accessToken || !parsed.user) {
        return;
      }

      this.accessToken.set(parsed.accessToken);
      this.refreshToken.set(parsed.refreshToken ?? null);
      this.userSignal.set(parsed.user);
    } catch {
      // A corrupt entry means signed out, not a crash on startup.
      this.clear();
    }
  }

  private storage(): Storage | undefined {
    try {
      return this.document.defaultView?.localStorage ?? undefined;
    } catch {
      return undefined;
    }
  }
}
