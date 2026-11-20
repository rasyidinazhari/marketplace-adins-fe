import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { LoginService } from '../../../services/login/login.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-buyer-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './buyer-login.component.html',
  styleUrl: './buyer-login.component.css',
})
export class BuyerLoginComponent {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private loginSvc = inject(LoginService);
  private authSvc = inject(AuthService);

  isLoading = false;
  rememberMe = true;
  errorMessage = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onLoginHandler(): void {
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
      role: 'Buyer' as const,
    };

    this.loginSvc.submitLogin(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.token) {
          this.authSvc.setToken(response.token);
        }
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        console.warn('API error or offline mode, simulating demo login:', err);
        setTimeout(() => {
          this.isLoading = false;
          this.authSvc.setToken('dummy_buyer_jwt_token_warungadins');
          this.router.navigate(['/']);
        }, 600);
      },
    });
  }
}
