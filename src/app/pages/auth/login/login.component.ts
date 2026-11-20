import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  FormBuilder,
  FormsModule,
  Validators,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LoginService } from '../../../services/login/login.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  constructor(private router: Router) {}
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  loginSvc = inject(LoginService);
  authSvc = inject(AuthService);
  rememberMe = false;
  isLoading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onLoginHandler() {
    const inputUserAuth = this.loginForm.value;

    this.loginSvc
      .submitLogin({
        email: inputUserAuth.email ?? '',
        password: inputUserAuth.password ?? '',
      })
      .subscribe((response: any) => {
        console.log(response);
        this.authSvc.setToken(response.token); // Handle successful login
      });
  }
}
