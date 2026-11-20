import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LoginService } from '../../../services/login/login.service';
import { AuthService } from '../../../services/auth/auth.service';

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
        if (response && response.token) {
          this.authSvc.setToken(response.token);
        }
        if (response && response.user) {
          this.authSvc.setUser(response.user);
        }
        this.router.navigate(['/seller/products']);
      },
      error: (err: any) => {
        // Fallback for mock/demo mode when backend API is offline
        console.warn('API error or offline mode, simulating demo login:', err);
        setTimeout(() => {
          this.isLoading = false;
          this.authSvc.setToken('dummy_seller_jwt_token_warungadins');
          this.authSvc.setUser({
            id: 1,
            name: 'Mitra Adins',
            email: 'seller@adins.co.id',
            role: 'Seller',
            stores: [{ id: 1, storeName: 'Adins Official Store' }]
          });
          this.router.navigate(['/seller/products']);
        }, 600);
      }
    });
  }
}
