import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterRequest, RegisterResponse } from '../../models/register.model';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private http = inject(HttpClient);
  private readonly apiAuthUrl = `${environment.apiUrl}/auth`;

  submitRegister(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiAuthUrl}/register`, data);
  }
}