import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { LandingComponent } from './pages/public/landing/landing.component';
import { ProductsComponent } from './pages/public/products/products.component';
// import { registerComponent } from './pages/auth/register/register.component';

export const routes: Routes = [
    {
        path: '',
        component: LandingComponent
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'products',
        component: ProductsComponent
    },
    {
        path: 'not-found',
        component: NotFoundComponent
    }
];
