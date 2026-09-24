import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth';

/** Endpoints that must never carry a token or trigger a refresh loop. */
const ANONYMOUS_PATHS = ['/api/auth/login', '/api/auth/refresh'];

/**
 * Attaches the access token, and recovers once from an expired one.
 *
 * Access tokens are deliberately short-lived, so a 401 mid-session is the
 * normal case rather than an error: refresh, then replay the request. If the
 * refresh also fails the session is genuinely over, and the user is sent to
 * the login screen with a return URL so they land back where they were.
 *
 * The login and refresh calls are excluded. Retrying a refresh with a refresh
 * that just failed is an infinite loop, and it would look like the app hanging.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAnonymous = ANONYMOUS_PATHS.some((path) => request.url.includes(path));
  const token = auth.token();

  const authorized =
    token && !isAnonymous
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      const isExpired = error instanceof HttpErrorResponse && error.status === 401;

      if (!isExpired || isAnonymous || !token) {
        return throwError(() => error);
      }

      return from(auth.refresh()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            void router.navigate(['/login'], {
              queryParams: { returnUrl: router.url },
            });

            return throwError(() => error);
          }

          return next(
            request.clone({
              setHeaders: { Authorization: `Bearer ${auth.token()}` },
            }),
          );
        }),
      );
    }),
  );
};
