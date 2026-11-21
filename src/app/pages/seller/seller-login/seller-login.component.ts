import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { LoginService } from '../../../services/login/login.service';

@Component({
  selector: 'app-seller-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './seller-login.component.html',
  styleUrl: './seller-login.component.css'
})
export class SellerLoginComponent {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private loginSvc = inject(LoginService);
  private authSvc = inject(AuthService);

  isLoading = false;
  rememberMe = true;
  errorMessage = '';

  loginForm = this.fb.group({
    email: ['seller@adins.co.id', [Validators.required, Validators.email]],
    password: ['password123', [Validators.required, Validators.minLength(6)]]
  });

  fillDemo(): void {
    this.loginForm.patchValue({
      email: 'seller@adins.co.id',
      password: 'password123'
    });
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formValue = this.loginForm.value;

    const payload = {
      email: formValue.email ?? '',
      password: formValue.password ?? '',
      role: 'Seller' as const
    };

    this.loginSvc.submitLogin(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (!response?.token || response.user?.role !== payload.role) {
          this.errorMessage = 'Respons login tidak valid.';
          return;
        }
        this.authSvc.setToken(response.token);
        this.authSvc.setUser(response.user);
        this.router.navigate(['/seller/products']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.status === 0
          ? 'Tidak dapat terhubung ke server. Coba lagi.'
          : err.error?.message || 'Gagal masuk. Periksa akun Anda dan coba lagi.';
      },
    });
  }
}
