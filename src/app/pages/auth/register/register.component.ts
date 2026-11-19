import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  role: 'buyer' | 'seller' = 'buyer';
  fullName = '';
  storeName = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  agreeTerms = false;
  isLoading = false;

  constructor(private router: Router) {}

  onSubmit(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      if (this.role === 'buyer') {
        this.router.navigate(['/products']);
      } else {
        this.router.navigate(['/seller/products']);
      }
    }, 700);
  }
}
