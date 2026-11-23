import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-compact-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './compact-footer.component.html',
  styleUrl: './compact-footer.component.css'
})
export class CompactFooterComponent {
  @Input() showCatalogLink = true;
}
