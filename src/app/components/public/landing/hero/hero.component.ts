import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth/auth.service';
import { LandingService } from '../../../../services/landing/landing.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit {
  private authSvc = inject(AuthService);
  private landingSvc = inject(LandingService);
  private cdr = inject(ChangeDetectorRef);

  totalProducts = 10000;
  totalSellers = 1200;
  isLoadingStats = true;

  ngOnInit(): void {
    this.landingSvc.getStats().subscribe({
      next: (res) => {
        if (res) {
          this.totalProducts = res.totalProducts;
          this.totalSellers = res.totalSellers;
        }
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Backend /api/landing/stats belum tersedia (server perlu di-restart). Menggunakan nilai fallback.', err);
        this.totalProducts = 10000;
        this.totalSellers = 1200;
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      }
    });
  }

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

