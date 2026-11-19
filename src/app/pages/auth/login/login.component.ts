import { Component } from '@angular/core';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TopNavbarComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

}
