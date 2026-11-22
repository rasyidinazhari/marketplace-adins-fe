import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TopNavbarComponent,
    CompactFooterComponent,
  ],
  templateUrl: './seller-layout.component.html',
  styleUrl: './seller-layout.component.css',
})
export class SellerLayoutComponent {
  private authSvc = inject(AuthService);

  get storeName(): string {
    const user = this.authSvc.getUser();
    console.log('user ', user);
    return this.authSvc.getStoreName() || 'Adins Official Store';
  }
}