import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductShowcaseComponent } from './components/public/landing/product-showcase/product-showcase.component';
import { HeroComponent } from './components/public/landing/hero/hero.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeroComponent, ProductShowcaseComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'marketplace-adins-fe';
}
