import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { HeroComponent } from '../../../components/public/landing/hero/hero.component';
import { ProductShowcaseComponent } from '../../../components/public/landing/product-showcase/product-showcase.component';
import { MainFooterComponent } from '../../../layout/main-footer/main-footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    TopNavbarComponent,
    HeroComponent,
    ProductShowcaseComponent,
    MainFooterComponent,
    RouterLink
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {}
