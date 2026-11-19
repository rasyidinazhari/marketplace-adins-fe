import { Component } from '@angular/core';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { HeroComponent } from '../../../components/public/landing/hero/hero.component';
import { ProductShowcaseComponent } from '../../../components/public/landing/product-showcase/product-showcase.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [TopNavbarComponent, HeroComponent, ProductShowcaseComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {

}
