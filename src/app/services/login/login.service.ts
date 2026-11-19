import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  http = inject(HttpClient)

  constructor() { }

  submitLogin(data: { email: string, password: string }) {
    return this.http.post(
      `${environment.apiUrl}/api/auth/login`,
      {
        email: data.email,
        password: data.password
      }
    )
  }
}
