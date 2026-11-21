import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class LogoutService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  logout(): void {
    if (this.authService.getToken()) {
      // Send the request while the interceptor can still read the bearer token.
      this.http.post<void>(`${environment.apiUrl}/auth/logout`, null).pipe(timeout(5000)).subscribe({
        error: () => {
          // Signing out locally also works when the API is unavailable.
        },
      });
    }

    this.authService.clearToken();
  }
}
