import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';
import { StoreSummary } from '../../../models/product.model';
import { ProductService } from '../../../services/product/product.service';
import { SellerStoreScopeService } from '../../../services/store/seller-store-scope.service';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TopNavbarComponent,
    CompactFooterComponent,
  ],
  providers: [SellerStoreScopeService],
  templateUrl: './seller-layout.component.html',
  styleUrl: './seller-layout.component.css',
})
export class SellerLayoutComponent implements OnInit {
  private productService = inject(ProductService);
  private destroyRef = inject(DestroyRef);
  storeControl = inject(SellerStoreScopeService).storeControl;

  stores: StoreSummary[] = [];
  isLoadingStores = false;
  storeLoadFailed = false;

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    if (this.isLoadingStores) return;

    this.isLoadingStores = true;
    this.storeLoadFailed = false;
    this.productService.getSellerStores().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: stores => {
        this.stores = stores;
        this.isLoadingStores = false;
      },
      error: () => {
        this.storeLoadFailed = true;
        this.isLoadingStores = false;
      },
    });
  }
}
