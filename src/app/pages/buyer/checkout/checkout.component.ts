import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbarComponent } from '../../../layout/top-navbar/top-navbar.component';
import { CompactFooterComponent } from '../../../layout/compact-footer/compact-footer.component';
import { ModalComponent } from '../../../components/ui/modal/modal.component';

export interface AddressItem {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  label: string;
  isPrimary?: boolean;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TopNavbarComponent, CompactFooterComponent, ModalComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {
  selectedCourier = 'reguler';
  selectedPayment = 'bca_va';
  isProcessing = false;

  // Modal Ubah Alamat State
  isAddressModalOpen = false;
  addressMode: 'select' | 'form' = 'select';
  tempSelectedAddressId = 1;

  savedAddresses: AddressItem[] = [
    {
      id: 1,
      name: 'Budi Santoso',
      phone: '0812-3456-7890',
      address: 'Jl. Jenderal Sudirman Kav. 52-53, SCBD, Gedung Menara Mandiri Lt. 12',
      city: 'Jakarta Selatan',
      postalCode: '12190',
      label: 'Kantor',
      isPrimary: true
    },
    {
      id: 2,
      name: 'Budi Santoso (Rumah)',
      phone: '0812-3456-7890',
      address: 'Cluster Harmoni Residence Blok B4 No. 12, Kel. Pondok Indah, Kec. Kebayoran Lama',
      city: 'Jakarta Selatan',
      postalCode: '12240',
      label: 'Rumah',
      isPrimary: false
    },
    {
      id: 3,
      name: 'Budi Santoso (Studio)',
      phone: '0813-9876-5432',
      address: 'Apartemen Casa Domaine Tower 1 Lt. 25 Unit 25A, Jl. K.H. Mas Mansyur Kav. 1',
      city: 'Jakarta Pusat',
      postalCode: '10220',
      label: 'Apartemen',
      isPrimary: false
    }
  ];

  shippingAddress: AddressItem = { ...this.savedAddresses[0] };

  newAddressForm = {
    name: '',
    phone: '',
    label: 'Rumah',
    city: 'Jakarta Selatan',
    postalCode: '',
    address: '',
    isPrimary: false
  };

  couriers = [
    { id: 'reguler', name: 'JNE Reguler', eta: '2 - 3 Hari', price: 15000 },
    { id: 'express', name: 'SiCepat Best Express', eta: '1 - 2 Hari', price: 25000 },
    { id: 'instant', name: 'GoSend Instant', eta: '3 Jam Tiba', price: 40000 }
  ];

  paymentMethods = [
    { id: 'bca_va', name: 'BCA Virtual Account', iconType: 'bank', desc: 'Verifikasi instan otomatis 24 jam' },
    { id: 'mandiri_va', name: 'Mandiri Virtual Account', iconType: 'card', desc: 'Transfer melalui Livin by Mandiri atau ATM' },
    { id: 'qris', name: 'QRIS (GoPay, OVO, ShopeePay)', iconType: 'qr', desc: 'Scan barcode melalui aplikasi e-wallet' }
  ];

  orderItems = [
    {
      name: 'Wireless Noise-Cancelling Headphones Pro ANC',
      price: 1499000,
      qty: 1,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
    },
    {
      name: 'Signature Arabica Coffee Beans Single Origin 250g',
      price: 85000,
      qty: 2,
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80'
    }
  ];

  subtotal = 1669000;
  discount = 50000;
  serviceFee = 1000;

  constructor(private router: Router) {}

  get currentShippingCost(): number {
    const courier = this.couriers.find(c => c.id === this.selectedCourier);
    return courier ? courier.price : 15000;
  }

  get grandTotal(): number {
    return this.subtotal - this.discount + this.currentShippingCost + this.serviceFee;
  }

  processPayment(): void {
    this.isProcessing = true;
    setTimeout(() => {
      this.isProcessing = false;
      this.router.navigate(['/buyer/orders/1']);
    }, 900);
  }

  openAddressModal(): void {
    this.tempSelectedAddressId = this.shippingAddress.id;
    this.addressMode = 'select';
    this.isAddressModalOpen = true;
  }

  closeAddressModal(): void {
    this.isAddressModalOpen = false;
  }

  selectAddress(id: number): void {
    this.tempSelectedAddressId = id;
  }

  confirmSelectAddress(): void {
    const selected = this.savedAddresses.find(a => a.id === this.tempSelectedAddressId);
    if (selected) {
      this.shippingAddress = { ...selected };
    }
    this.isAddressModalOpen = false;
  }

  switchToNewAddress(): void {
    this.addressMode = 'form';
    this.newAddressForm = {
      name: '',
      phone: '',
      label: 'Rumah',
      city: 'Jakarta Selatan',
      postalCode: '',
      address: '',
      isPrimary: false
    };
  }

  switchToSelectAddress(): void {
    this.addressMode = 'select';
  }

  saveNewAddress(): void {
    if (!this.newAddressForm.name || !this.newAddressForm.phone || !this.newAddressForm.address) {
      alert('Silakan lengkapi nama penerima, nomor telepon, dan alamat lengkap.');
      return;
    }

    const newId = Date.now();
    const newAddress: AddressItem = {
      id: newId,
      name: this.newAddressForm.name,
      phone: this.newAddressForm.phone,
      label: this.newAddressForm.label || 'Alamat Baru',
      city: this.newAddressForm.city || 'Jakarta',
      postalCode: this.newAddressForm.postalCode || '10110',
      address: this.newAddressForm.address,
      isPrimary: this.newAddressForm.isPrimary
    };

    if (newAddress.isPrimary) {
      this.savedAddresses.forEach(a => a.isPrimary = false);
    }

    this.savedAddresses.unshift(newAddress);
    this.shippingAddress = { ...newAddress };
    this.tempSelectedAddressId = newId;
    this.addressMode = 'select';
    this.isAddressModalOpen = false;
  }
}
