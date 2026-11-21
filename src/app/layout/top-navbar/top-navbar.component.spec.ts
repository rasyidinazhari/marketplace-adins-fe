import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth/auth.service';
import { TopNavbarComponent } from './top-navbar.component';

describe('TopNavbarComponent', () => {
  let component: TopNavbarComponent;
  let fixture: ComponentFixture<TopNavbarComponent>;
  let role: UserRole | null;

  beforeEach(async () => {
    role = null;
    await TestBed.configureTestingModule({
      imports: [TopNavbarComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { getCurrentRole: () => role } }],
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
    navbar.querySelector<HTMLButtonElement>('button[aria-label="Menu navigasi"]')!.click();
    fixture.detectChanges();

    expect(countLinks('/products')).toBe(2);
    expect(countLinks('/buyer/login')).toBe(1);
    expect(countLinks('/register')).toBe(1);
    expect(countLinks('/cart')).toBe(0);
    expect(countLinks('/buyer/orders')).toBe(0);
    expect(countLinks('/seller/products')).toBe(0);

    role = 'Buyer';
    fixture.detectChanges();

    expect(countLinks('/products')).toBe(2);
    expect(countLinks('/buyer/login')).toBe(0);
    expect(countLinks('/register')).toBe(0);
    expect(countLinks('/cart')).toBe(2);
    expect(countLinks('/buyer/orders')).toBe(2);
    expect(countLinks('/seller/products')).toBe(0);

    role = 'Seller';
    fixture.detectChanges();

    expect(countLinks('/products')).toBe(0);
    expect(countLinks('/cart')).toBe(0);
    expect(countLinks('/buyer/orders')).toBe(0);
    expect(countLinks('/seller/products')).toBe(2);
    expect(countLinks('/seller/orders')).toBe(2);
    expect(countLinks('/seller/vouchers')).toBe(2);
    expect(navbar.querySelector('input')).toBeNull();
  });
});
