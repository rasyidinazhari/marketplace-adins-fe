import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LoginService } from '../../../services/login/login.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  loginSvc = inject(LoginService);
  authSvc = inject(AuthService);

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
        // console.log(response);
        this.authSvc.setToken(response.token); // Handle successful login
      });
  }
}
