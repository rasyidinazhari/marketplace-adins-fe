import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth/auth.service';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.css'
})
export class TopNavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('accountMenu') private accountMenu?: ElementRef<HTMLElement>;

  isMobileMenuOpen = false;
  isAccountMenuOpen = false;

  get role(): UserRole | 'Guest' {
    return this.authService.getCurrentRole() ?? 'Guest';
  }

  get accountName(): string {
    return this.authService.getUser()?.name?.trim() || 'Akun';
  }

  toggleMobileMenu(): void {
    this.isAccountMenuOpen = false;
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleAccountMenu(): void {
    this.isMobileMenuOpen = false;
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  @HostListener('document:click', ['$event.target'])
  closeAccountMenuOnOutsideClick(target: Node | null): void {
    if (this.isAccountMenuOpen && !this.accountMenu?.nativeElement.contains(target)) {
      this.isAccountMenuOpen = false;
    }
  }

  logout(): void {
    this.isAccountMenuOpen = false;
    this.authService.clearToken();
    void this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
