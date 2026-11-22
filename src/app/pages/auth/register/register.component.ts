import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { switchMap, of, map } from 'rxjs';
import { RegisterService } from '../../../services/register/register.service';
import { StoreService } from '../../../services/store/store.service';
import { RegisterRequest, RegisterResponse, UserRole } from '../../../models/register.model';
import { StoreRequest, StoreResponse } from '../../../models/store.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private router = inject(Router);
  private registerSvc = inject(RegisterService);
  private storeSvc = inject(StoreService);
  private cdr = inject(ChangeDetectorRef);

  role: UserRole = 'Buyer';
  fullName = '';
  storeName = '';
  email = '';
  password = '';
  confirmPassword = '';
  agreeTerms = false;

  isLoading = false;
  loadingText = 'Mendaftarkan akun...';
  errorMessage = '';
  successMessage = '';

  selectRole(selectedRole: UserRole): void {
    this.role = selectedRole;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const normalizedRole: UserRole = this.role === 'Seller' ? 'Seller' : 'Buyer';
    const trimmedStoreName = this.storeName.trim();

    if (!this.fullName.trim() || !this.email.trim() || !this.password) {
      this.errorMessage = 'Nama, email, dan kata sandi wajib diisi.';
      return;
    }

    if (normalizedRole === 'Seller') {
      if (!trimmedStoreName) {
        this.errorMessage = 'Nama toko resmi wajib diisi untuk penjual.';
        return;
      }
      if (trimmedStoreName.length < 5) {
        this.errorMessage = 'Nama toko resmi minimal 5 karakter.';
        return;
      }
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Kata sandi minimal 6 karakter.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Konfirmasi kata sandi tidak cocok.';
      return;
    }

    if (!this.agreeTerms) {
      this.errorMessage = 'Anda harus menyetujui Syarat & Ketentuan terlebih dahulu.';
      return;
    }

    const registerPayload: RegisterRequest = {
      name: this.fullName.trim(),
      email: this.email.trim(),
      password: this.password,
      role: normalizedRole
    };

    this.isLoading = true;
    this.loadingText = 'Mendaftarkan akun...';

    this.registerSvc.submitRegister(registerPayload).pipe(
      switchMap((registerRes: RegisterResponse) => {
        if (normalizedRole !== 'Seller') {
          return of<{ registerRes: RegisterResponse; storeRes: StoreResponse | null }>({
            registerRes,
            storeRes: null
          });
        }

        this.loadingText = 'Membuat toko resmi Anda...';
        this.cdr.detectChanges();

        const storePayload: StoreRequest = {
          userId: registerRes.id,
          storeName: trimmedStoreName
        };

        return this.storeSvc.createStore(storePayload).pipe(
          map((storeRes: StoreResponse) => ({ registerRes, storeRes }))
        );
      })
    ).subscribe({
      next: ({ registerRes, storeRes }) => {
        this.isLoading = false;
        this.successMessage = storeRes
          ? `Registrasi berhasil & toko "${storeRes.storeName}" telah dibuat! Mengalihkan ke halaman masuk...`
          : (registerRes?.message || 'Registrasi berhasil! Mengalihkan ke halaman masuk...');
        this.cdr.detectChanges();

        setTimeout(() => {
          if (normalizedRole === 'Seller') {
            this.router.navigate(['/seller/login']);
          } else {
            this.router.navigate(['/buyer/login']);
          }
        }, 1200);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Gagal proses registrasi/pembuatan toko:', err);

        if (err.status === 0) {
          this.errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi atau status API.';
        } else if (typeof err.error === 'string' && err.error.trim()) {
          this.errorMessage = err.error;
        } else if (err.error?.errors) {
          const firstKey = Object.keys(err.error.errors)[0];
          this.errorMessage = err.error.errors[firstKey]?.[0] || 'Data tidak valid.';
        } else {
          this.errorMessage =
            err.error?.message ||
            err.error?.title ||
            'Registrasi gagal. Periksa kembali data Anda.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}