import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() size: ModalSize = 'md';
  @Input() showCloseButton: boolean = true;
  @Input() closeOnBackdrop: boolean = true;
  @Input() closeOnEscape: boolean = true;

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    if (this.isOpen && this.closeOnEscape) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.close.emit();
  }

  handleBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop) {
      this.closeModal();
    }
  }

  stopClickPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  getSizeClass(): string {
    switch (this.size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case '2xl':
        return 'max-w-5xl';
      default:
        return 'max-w-lg';
    }
  }
}
