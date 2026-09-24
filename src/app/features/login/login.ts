import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideEye, LucideEyeOff, LucideLogIn } from '@lucide/angular';

import { AuthService } from '../../core/services/auth';
import { I18nService } from '../../core/services/i18n';
import { BusyIcon } from '../../shared/components/busy-icon/busy-icon';
import { BusyState } from '../../shared/utils/busy-state';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BusyIcon,
    LucideEye,
    LucideEyeOff,
    LucideLogIn,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly i18n = inject(I18nService);
  protected readonly busy = new BusyState();
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected togglePassword(): void {
    this.showPassword.update((shown) => !shown);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    const { email, password } = this.form.getRawValue();

    try {
      await this.busy.run('login', () => this.auth.login(email, password));

      // Back to wherever the guard interrupted, or the first module this role
      // can open.
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(returnUrl ?? this.landingFor());
    } catch (error) {
      this.error.set(this.describe(error));
    }
  }

  private landingFor(): string {
    return this.auth.canReach('dashboard') ? '/dashboard' : '/transport';
  }

  /**
   * The API answers a wrong password and an unknown email identically, so
   * there is nothing here to distinguish either — which is the point.
   */
  private describe(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status?: number }).status;

      if (status === 423) {
        return this.i18n.t('accountLocked');
      }

      if (status === 401) {
        return this.i18n.t('invalidCredentials');
      }

      if (status === 0) {
        return this.i18n.t('serverUnreachable');
      }
    }

    return this.i18n.t('actionFailed');
  }
}
