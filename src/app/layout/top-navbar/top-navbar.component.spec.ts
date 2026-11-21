import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth/auth.service';
import { LogoutService } from '../../services/logout/logout.service';
import { TopNavbarComponent } from './top-navbar.component';

describe('TopNavbarComponent', () => {
  let component: TopNavbarComponent;
  let fixture: ComponentFixture<TopNavbarComponent>;
  let role: UserRole | null;
  let logout: jasmine.Spy;

  beforeEach(async () => {
    role = null;
    logout = jasmine.createSpy('logout').and.callFake(() => { role = null; });
    await TestBed.configureTestingModule({
      imports: [TopNavbarComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { getCurrentRole: () => role, getUser: () => ({ name: 'Dina' }) },
        },
        { provide: LogoutService, useValue: { logout } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updates desktop and mobile navigation for guest, buyer, and seller', () => {
    const navbar: HTMLElement = fixture.nativeElement;
    const countLinks = (path: string) => navbar.querySelectorAll(`a[href="${path}"]`).length;
    const accountButton = () => navbar.querySelector('button[aria-controls="navbar-account-panel"]');
    navbar.querySelector<HTMLButtonElement>('button[aria-label="Menu navigasi"]')!.click();
    fixture.detectChanges();

    expect(countLinks('/products')).toBe(2);
    expect(countLinks('/buyer/login')).toBe(1);
    expect(countLinks('/register')).toBe(1);
    expect(countLinks('/cart')).toBe(0);
    expect(countLinks('/buyer/orders')).toBe(0);
    expect(countLinks('/seller/products')).toBe(0);
    expect(accountButton()).toBeNull();

    role = 'Buyer';
    fixture.detectChanges();

    expect(countLinks('/products')).toBe(2);
    expect(countLinks('/buyer/login')).toBe(0);
    expect(countLinks('/register')).toBe(0);
    expect(countLinks('/cart')).toBe(2);
    expect(countLinks('/buyer/orders')).toBe(2);
    expect(countLinks('/seller/products')).toBe(0);
    expect(accountButton()?.textContent).toContain('Dina');

    role = 'Seller';
    fixture.detectChanges();

    expect(countLinks('/products')).toBe(0);
    expect(countLinks('/cart')).toBe(0);
    expect(countLinks('/buyer/orders')).toBe(0);
    expect(countLinks('/seller/products')).toBe(2);
    expect(countLinks('/seller/orders')).toBe(2);
    expect(countLinks('/seller/vouchers')).toBe(2);
    expect(navbar.querySelector('input')).toBeNull();
    expect(accountButton()?.textContent).toContain('Dina');
  });

  it('opens the account menu and returns home as a guest after logout', () => {
    role = 'Seller';
    fixture.detectChanges();

    const navigateHome = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    const navbar: HTMLElement = fixture.nativeElement;
    const accountButton = navbar.querySelector<HTMLButtonElement>('button[aria-controls="navbar-account-panel"]')!;
    const dropdown = navbar.querySelector<HTMLElement>('#navbar-account-panel')!;
    expect(dropdown.hidden).toBeTrue();

    accountButton.click();
    fixture.detectChanges();
    expect(accountButton.getAttribute('aria-expanded')).toBe('true');
    expect(dropdown.hidden).toBeFalse();

    navbar.querySelector('header')!.click();
    fixture.detectChanges();
    expect(dropdown.hidden).toBeTrue();

    accountButton.click();
    fixture.detectChanges();
    dropdown.querySelector('button')!.click();
    fixture.detectChanges();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigateHome).toHaveBeenCalledWith('/', { replaceUrl: true });
    expect(navbar.querySelector('#navbar-account-panel')).toBeNull();
    expect(navbar.querySelector('a[href="/buyer/login"]')?.textContent).toContain('Masuk');
  });
});
