import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }
  setToken(token: string) {
    localStorage.setItem('auth_token', token)
  }

  getToken() {
    return localStorage.getItem('auth_token')
  }

  clearToken() {
    localStorage.removeItem('auth_token')
  }
}
