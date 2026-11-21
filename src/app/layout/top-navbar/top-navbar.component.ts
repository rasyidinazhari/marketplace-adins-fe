import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth/auth.service';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.css'
})
export class TopNavbarComponent {
  private readonly authService = inject(AuthService);
  isMobileMenuOpen = false;

  get role(): UserRole | 'Guest' {
    return this.authService.getCurrentRole() ?? 'Guest';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
