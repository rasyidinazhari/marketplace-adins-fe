import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../../interceptors/auth.interceptor';
import { AuthService } from '../auth/auth.service';
import { LogoutService } from './logout.service';

describe('LogoutService', () => {
  let logoutService: LogoutService;
  let authService: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    logoutService = TestBed.inject(LogoutService);
    authService = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    authService.clearToken();
  });

  afterEach(() => {
    authService.clearToken();
    http.verify();
  });

  it('sends the bearer token and clears the local session without waiting for the API', () => {
    authService.setToken('current-token');
    authService.setUser({ id: 1, name: 'Dina', email: 'dina@example.com', role: 'Buyer' });

    logoutService.logout();

    const request = http.expectOne({ method: 'POST', url: `${environment.apiUrl}/auth/logout` });
    expect(request.request.headers.get('Authorization')).toBe('Bearer current-token');
    expect(request.request.body).toBeNull();
    expect(authService.getToken()).toBeNull();
    expect(authService.getUser()).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('keeps the user signed out when the logout endpoint is unavailable', () => {
    authService.setToken('current-token');

    logoutService.logout();

    http.expectOne(`${environment.apiUrl}/auth/logout`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(authService.getToken()).toBeNull();
  });
});
