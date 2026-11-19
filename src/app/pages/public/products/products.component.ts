import { Component } from '@angular/core';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { ProductContainerComponent } from '../../../components/public/products/product-container/product-container.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [TopNavbarComponent, ProductContainerComponent, CompactFooterComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {}
