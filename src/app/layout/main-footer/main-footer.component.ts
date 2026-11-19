import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './main-footer.component.html',
  styleUrl: './main-footer.component.css'
})
export class MainFooterComponent {
  newsletterEmail = '';
  isSubscribed = false;

  subscribeNewsletter(): void {
    if (this.newsletterEmail.trim()) {
      this.isSubscribed = true;
      setTimeout(() => {
        this.newsletterEmail = '';
      }, 2000);
    }
  }
}
