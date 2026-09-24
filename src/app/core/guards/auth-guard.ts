import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth';

/**
 * Keeps signed-out visitors off the application shell.
 *
 * A convenience, not a security control: the data lives behind the API, which
 * refuses unauthenticated calls on its own. This exists so a signed-out user
 * sees a login form instead of a screen full of failed requests.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.requiresSignIn || auth.isSignedIn()) {
    return true;
  }

  // Carries where they were headed, so signing in resumes rather than dumping
  // them on the dashboard.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * Keeps a role off a module it has no business in.
 *
 * Same caveat: the API returns 403 for these routes regardless. Checking here
 * means a carrier who types /projects gets sent somewhere useful instead of
 * watching every request on the page fail.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const path = route.routeConfig?.path ?? '';

  if (auth.canReach(path)) {
    return true;
  }

  // To the first module their role can actually open, rather than a loop back
  // into a route they will be bounced out of again.
  return router.createUrlTree([auth.canReach('dashboard') ? '/dashboard' : '/transport']);
};
