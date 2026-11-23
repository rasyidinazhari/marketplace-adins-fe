import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { LoginService } from '../../../services/login/login.service';

const MIN_PASSWORD_LENGTH = 6;

type LoginField = 'email' | 'password';

const FIELD_MESSAGES: Record<LoginField, Record<string, string>> = {
  email: {
    required: 'Email wajib diisi.',
    email: 'Format email tidak valid.',
  },
  password: {
    required: 'Kata sandi wajib diisi.',
    minlength: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
  },
};

@Component({
  selector: 'app-seller-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './seller-login.component.html',
  styleUrl: './seller-login.component.css'
})
export class SellerLoginComponent {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private loginSvc = inject(LoginService);
  private authSvc = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  showPassword = false;
  errorMessage = '';

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /** Pesan error untuk satu kolom. String kosong jika valid atau belum disentuh. */
  fieldError(field: LoginField): string {
    const control = this.loginForm.controls[field];
    if (!control.invalid || !control.touched) return '';

    const errors = control.errors ?? {};
    const messages = FIELD_MESSAGES[field];
    const key = Object.keys(messages).find(errorKey => errors[errorKey]);
    return key ? messages[key] : 'Nilai tidak valid.';
  }

  onSubmit(): void {
    if (this.isLoading) return;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.getRawValue();
    const payload = {
      email: email.trim(),
      password,
      role: 'Seller' as const
    };

    // Cegah ubah isi form / submit ganda selama request berjalan.
    this.loginForm.disable({ emitEvent: false });

    this.loginSvc.submitLogin(payload).subscribe({
      next: (response: any) => {
        if (!response?.token || response.user?.role !== payload.role) {
          this.isLoading = false;
          this.loginForm.enable({ emitEvent: false });
          this.errorMessage = 'Respons login tidak valid atau akun bukan Seller.';
          this.cdr.detectChanges();
          return;
        }

        this.isLoading = false;
        this.authSvc.setToken(response.token);
        this.authSvc.setUser(response.user);
        this.router.navigate(['/seller/products']);
      },
      error: (err) => {
        this.isLoading = false;
        this.loginForm.enable({ emitEvent: false });
        this.errorMessage = err.status === 0
          ? 'Tidak dapat terhubung ke server. Coba lagi.'
          : err.error?.message || 'Gagal masuk. Periksa email, kata sandi, atau role akun Anda.';
        this.cdr.detectChanges();
      },
    });
  }
}