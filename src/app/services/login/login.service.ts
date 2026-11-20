import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface LoginPayload {
  email: string;
  password: string;
  role: 'Buyer' | 'Seller';
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  http = inject(HttpClient);
  constructor() {}

  submitLogin(data: LoginPayload) {
    return this.http.post(`${environment.apiUrl}/auth/login`, data);
  }
}
