import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { switchMap, of, map } from 'rxjs';
import { RegisterService } from '../../../services/register/register.service';
import { StoreService } from '../../../services/store/store.service';
import { RegisterRequest, RegisterResponse, UserRole } from '../../../models/register.model';
import { StoreRequest, StoreResponse } from '../../../models/store.model';

const MIN_PASSWORD_LENGTH = 6;
const MIN_STORE_NAME_LENGTH = 5;

type RegisterField = 'fullName' | 'storeName' | 'email' | 'password' | 'confirmPassword' | 'agreeTerms';

/** Tidak boleh kosong atau hanya spasi. */
const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

/** Panjang minimum setelah di-trim (untuk nama toko). */
const minTrimmedLength = (min: number): ValidatorFn => (control: AbstractControl): ValidationErrors | null => {
  const value = typeof control.value === 'string' ? control.value.trim() : '';
  return value.length === 0 || value.length >= min ? null : { minlength: true };
};

/** Validator level form: password dan konfirmasi harus sama. */
const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return confirmPassword && password !== confirmPassword ? { mismatch: true } : null;
};

const FIELD_MESSAGES: Record<RegisterField, Record<string, string>> = {
  fullName: {
    required: 'Nama wajib diisi.',
  },
  storeName: {
    required: 'Nama toko resmi wajib diisi untuk penjual.',
    minlength: `Nama toko resmi minimal ${MIN_STORE_NAME_LENGTH} karakter.`,
  },
  email: {
    required: 'Email wajib diisi.',
    email: 'Format email tidak valid.',
  },
  password: {
    required: 'Kata sandi wajib diisi.',
    minlength: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
  },
  confirmPassword: {
    required: 'Ulangi kata sandi wajib diisi.',
    mismatch: 'Konfirmasi kata sandi tidak cocok.',
  },
  agreeTerms: {
    required: 'Anda harus menyetujui Syarat & Ketentuan terlebih dahulu.',
  },
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private router = inject(Router);
  private registerSvc = inject(RegisterService);
  private storeSvc = inject(StoreService);
  private cdr = inject(ChangeDetectorRef);
  private formBuilder = inject(FormBuilder);

  readonly minPasswordLength = MIN_PASSWORD_LENGTH;

  role: UserRole = 'Buyer';

  registerForm = this.formBuilder.nonNullable.group(
    {
      fullName: ['', [Validators.required, notBlank]],
      storeName: [''], // validator ditambahkan saat role = Seller
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch },
  );

  isLoading = false;
  loadingText = 'Mendaftarkan akun...';
  errorMessage = '';
  successMessage = '';

  selectRole(selectedRole: UserRole): void {
    if (this.isLoading) return;

    this.role = selectedRole;
    this.errorMessage = '';
    this.successMessage = '';

    const storeNameControl = this.registerForm.controls.storeName;
    if (selectedRole === 'Seller') {
      storeNameControl.setValidators([
        Validators.required,
        notBlank,
        minTrimmedLength(MIN_STORE_NAME_LENGTH),
      ]);
    } else {
      storeNameControl.clearValidators();
      storeNameControl.reset('');
    }
    storeNameControl.updateValueAndValidity();
  }

  // --- VALIDASI FORM ---

  /** Pesan error untuk satu kolom. String kosong jika valid atau belum disentuh. */
  fieldError(field: RegisterField): string {
    const control = this.registerForm.controls[field];
    if (!control.touched) return '';

    const messages = FIELD_MESSAGES[field];
    const errors = { ...(control.errors ?? {}) } as Record<string, unknown>;

    // Error "mismatch" ada di level form, bukan di kontrol konfirmasi.
    if (field === 'confirmPassword' && this.registerForm.errors?.['mismatch']) {
      errors['mismatch'] = true;
    }

    const key = Object.keys(messages).find(errorKey => errors[errorKey]);
    return key ? messages[key] : '';
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const normalizedRole: UserRole = this.role === 'Seller' ? 'Seller' : 'Buyer';
    const { fullName, storeName, email, password } = this.registerForm.getRawValue();
    const trimmedStoreName = storeName.trim();

    const registerPayload: RegisterRequest = {
      name: fullName.trim(),
      email: email.trim(),
      password,
      role: normalizedRole
    };

    this.isLoading = true;
    this.loadingText = 'Mendaftarkan akun...';
    this.registerForm.disable({ emitEvent: false });

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
        this.registerForm.enable({ emitEvent: false });
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