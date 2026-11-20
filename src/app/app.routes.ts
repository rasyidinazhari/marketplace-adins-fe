import { Routes } from '@angular/router';

// Public Pages
import { LandingComponent } from './pages/public/landing/landing.component';
import { ProductsComponent } from './pages/public/products/products.component';
import { PublicProductDetailComponent } from './pages/public/product-detail/product-detail.component';

// Auth Pages
import { BuyerLoginComponent } from './pages/buyer/buyer-login/buyer-login.component';
import { SellerLoginComponent } from './pages/seller/seller-login/seller-login.component';
import { RegisterComponent } from './pages/auth/register/register.component';

// Buyer Pages
import { CartComponent } from './pages/buyer/cart/cart.component';
import { CheckoutComponent } from './pages/buyer/checkout/checkout.component';
import { BuyerOrderListComponent } from './pages/buyer/buyer-order-list/buyer-order-list.component';
import { BuyerOrderDetailComponent } from './pages/buyer/buyer-order-detail/buyer-order-detail.component';

// Seller Pages
import { ProductListComponent } from './pages/seller/product-list/product-list.component';
import { ProductDetailComponent } from './pages/seller/product-detail/product-detail.component';
import { SellerOrderListComponent } from './pages/seller/seller-order-list/seller-order-list.component';
import { SellerOrderDetailComponent } from './pages/seller/seller-order-detail/seller-order-detail.component';
import { VoucherComponent } from './pages/seller/voucher/voucher.component';

// 404 Not Found
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  // Public
  {
    path: '',
    component: LandingComponent,
    title: 'WarungAdins - Marketplace Modern'
  },
  {
    path: 'products',
    component: ProductsComponent,
    title: 'Katalog Produk - WarungAdins'
  },
  {
    path: 'products/:id',
    component: PublicProductDetailComponent,
    title: 'Detail Produk - WarungAdins'
  },

  // Auth / Role Logins
  {
    path: 'buyer/login',
    component: BuyerLoginComponent,
    title: 'Masuk Akun Pembeli - WarungAdins'
  },
  {
    path: 'seller/login',
    component: SellerLoginComponent,
    title: 'Portal Mitra Penjual - WarungAdins'
  },
  {
    path: 'login',
    redirectTo: 'buyer/login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    component: RegisterComponent,
    title: 'Daftar Akun Baru - WarungAdins'
  },

  // Buyer
  {
    path: 'cart',
    component: CartComponent,
    title: 'Keranjang Belanja - WarungAdins'
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    title: 'Checkout & Pembayaran - WarungAdins'
  },
  {
    path: 'buyer/orders',
    component: BuyerOrderListComponent,
    title: 'Pesanan Saya - WarungAdins'
  },
  {
    path: 'buyer/orders/:id',
    component: BuyerOrderDetailComponent,
    title: 'Detail Pesanan - WarungAdins'
  },

  // Seller
  {
    path: 'seller/products',
    component: ProductListComponent,
    title: 'Kelola Produk - Dashboard Penjual'
  },
  {
    path: 'seller/products/new',
    component: ProductDetailComponent,
    title: 'Tambah Produk Baru - Dashboard Penjual'
  },
  {
    path: 'seller/products/:id',
    component: ProductDetailComponent,
    title: 'Edit Produk - Dashboard Penjual'
  },
  {
    path: 'seller/orders',
    component: SellerOrderListComponent,
    title: 'Pesanan Masuk - Dashboard Penjual'
  },
  {
    path: 'seller/orders/:id',
    component: SellerOrderDetailComponent,
    title: 'Detail Pesanan Masuk - Dashboard Penjual'
  },
  {
    path: 'seller/vouchers',
    component: VoucherComponent,
    title: 'Kelola Voucher & Promo - Dashboard Penjual'
  },

  // Not Found fallback
  {
    path: 'not-found',
    component: NotFoundComponent,
    title: '404 - Halaman Tidak Ditemukan'
  },
  {
    path: '**',
    redirectTo: 'not-found'
  }
];
