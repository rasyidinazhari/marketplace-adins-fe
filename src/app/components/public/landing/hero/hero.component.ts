import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  private authSvc = inject(AuthService);

  get isSeller(): boolean {
    return this.authSvc.getCurrentRole() === 'Seller';
  }

  scrollToRekomendasi(): void {
    const element = document.getElementById('rekomendasi');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

