import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../environments/environment';
import { routes } from '../app.routes';
import { AuthService } from '../services/auth/auth.service';

describe('Route access', () => {
  let auth: AuthService;
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    auth.clearToken();
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => auth.clearToken());

  function loginResponse(role: 'Buyer' | 'Seller', expiresInSeconds = 3600) {
    const claims = {
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };
    const payload = btoa(JSON.stringify(claims)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    return {
      token: 'eyJhbGciOiJIUzI1NiJ9.' + payload + '.test',
      user: { id: 1, name: 'Test', email: 'test@example.com', role },
    };
  }

  function restoreSession(role: 'Buyer' | 'Seller', expiresInSeconds = 3600): void {
    const { token, user } = loginResponse(role, expiresInSeconds);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  async function expectRoute(path: string, expected = path): Promise<void> {
    await harness.navigateByUrl(path);
    expect(router.url).withContext(path).toBe(expected);
  }

  it('directs guests to the login for each protected area', async () => {
    for (const path of ['/cart', '/checkout', '/buyer/orders', '/buyer/orders/1']) {
      await expectRoute(path, '/buyer/login');
    }
    for (const path of ['/seller', '/seller/products/new', '/seller/orders/1', '/seller/vouchers']) {
      await expectRoute(path, '/seller/login');
    }
    await expectRoute('/login', '/buyer/login');
    await expectRoute('/register');
    await expectRoute('/');
    await expectRoute('/products');
    await expectRoute('/products/1');
    await expectRoute('/missing-page', '/not-found');
  });

  it('allows buyer routes and redirects seller and guest-only routes home', async () => {
    restoreSession('Buyer');
    await expectRoute('/');
    await expectRoute('/checkout');
    await expectRoute('/buyer/orders/1');
    for (const path of ['/seller', '/seller/products/new', '/seller/orders/1', '/seller/vouchers']) {
      await expectRoute(path, '/');
    }
    await expectRoute('/seller/login', '/');
    await expectRoute('/login', '/');
    await expectRoute('/register', '/');
    await expectRoute('/products');
    await expectRoute('/products/1');
  });

  it('keeps sellers in their dashboard and rechecks access on child navigation', async () => {
    restoreSession('Seller');
    await expectRoute('/seller', '/seller/products');
    expect(harness.routeNativeElement!.querySelector('a[href="/"], a[href="/products"]')).toBeNull();
    for (const path of ['/', '/products', '/products/1', '/cart', '/checkout', '/buyer/orders', '/buyer/orders/1']) {
      await expectRoute(path, '/seller/products');
    }
    for (const path of ['/buyer/login', '/seller/login', '/register']) {
      await expectRoute(path, '/seller/products');
    }
    await expectRoute('/seller/vouchers');
    restoreSession('Seller', -1);
    await expectRoute('/seller/orders', '/seller/login');
    expect(auth.getToken()).toBeNull();
  });

  it('treats old demo tokens as guest sessions', async () => {
    restoreSession('Seller');
    localStorage.setItem('auth_token', 'dummy_seller_jwt_token_warungadins');
    await expectRoute('/seller/vouchers', '/seller/login');
    expect(localStorage.getItem('auth_user')).toBeNull();
  });

  for (const role of ['Buyer', 'Seller'] as const) {
    it('keeps the ' + role + ' form open on failure and navigates after success', async () => {
      const path = role === 'Buyer' ? '/buyer/login' : '/seller/login';
      await expectRoute(path);
      const form: HTMLFormElement = harness.routeNativeElement!.querySelector('form')!;
      for (const [field, value] of [['email', 'test@example.com'], ['password', 'testpassword']]) {
        const input = form.querySelector<HTMLInputElement>(`input[formControlName="${field}"]`)!;
        input.value = value;
        input.dispatchEvent(new Event('input'));
      }

      const http = TestBed.inject(HttpTestingController);
      form.dispatchEvent(new Event('submit'));
      const failed = http.expectOne(environment.apiUrl + '/auth/login');
      failed.flush({ message: 'Login gagal.' }, { status: 401, statusText: 'Unauthorized' });
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(router.url).toBe(path);
      expect(harness.routeNativeElement!.textContent).toContain('Login gagal.');
      expect(auth.getUser()).toBeNull();

      form.dispatchEvent(new Event('submit'));
      http.expectOne(environment.apiUrl + '/auth/login').flush(loginResponse(role));
      await harness.fixture.whenStable();
      expect(auth.getUser()?.role).toBe(role);
      expect(router.url).toBe(role === 'Buyer' ? '/' : '/seller/products');
    });
  }
});
