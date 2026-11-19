import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  isLoading = false;

  constructor(private router: Router) {}

  onSubmit(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/']);
    }, 600);
  }

  fillDemo(role: 'buyer' | 'seller'): void {
    if (role === 'buyer') {
      this.email = 'buyer@warungadins.com';
      this.password = 'password123';
      this.router.navigate(['/buyer/orders']);
    } else {
      this.email = 'seller@warungadins.com';
      this.password = 'sellerpass123';
      this.router.navigate(['/seller/products']);
    }
  }
}
