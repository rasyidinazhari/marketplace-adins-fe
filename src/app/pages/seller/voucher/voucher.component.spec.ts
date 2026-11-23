import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { SellerVoucher } from '../../../models/voucher.model';
import { VoucherComponent } from './voucher.component';

describe('VoucherComponent', () => {
  let fixture: ComponentFixture<VoucherComponent>;
  let http: HttpTestingController;
  let view: HTMLElement;
  const storesUrl = `${environment.apiUrl}/seller/stores`;
  const vouchersUrl = `${environment.apiUrl}/stores/2/vouchers`;
  const firstStore = { id: 2, storeName: 'Toko Satu' };
  const secondStore = { id: 3, storeName: 'Toko Dua' };
  const voucher: SellerVoucher = {
    id: 5,
    storeId: 2,
    code: 'PromoBaru',
    discountPercentage: 10,
    minPurchaseAmount: 0,
    maxDiscountAmount: 25000,
    isActive: true,
    createdAt: null,
    updatedAt: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VoucherComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(VoucherComponent);
    http = TestBed.inject(HttpTestingController);
    view = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  function findButton(text: string): HTMLButtonElement {
    return Array.from(view.querySelectorAll('button')).find(button => button.textContent?.trim() === text)!;
  }

  function loadSingleStore(vouchers: SellerVoucher[]): void {
    fixture.detectChanges();
    http.expectOne({ method: 'GET', url: storesUrl }).flush([firstStore]);
    http.expectOne({ method: 'GET', url: vouchersUrl }).flush(vouchers);
    fixture.detectChanges();
  }

  function enterValue(id: string, value: string): void {
    const input = view.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('disables voucher creation when the seller has no store', () => {
    fixture.detectChanges();
    http.expectOne({ method: 'GET', url: storesUrl }).flush([]);
    fixture.detectChanges();

    expect(view.textContent).toContain('Akun ini belum memiliki toko.');
    expect(findButton('+ Buat Voucher Baru').disabled).toBeTrue();
  });

  it('loads vouchers for the first store automatically when the API returns several stores', () => {
    fixture.detectChanges();
    http.expectOne(storesUrl).flush([firstStore, secondStore]);
    http.expectOne(vouchersUrl).flush([voucher]);
    fixture.detectChanges();

    http.expectNone(`${environment.apiUrl}/stores/3/vouchers`);
    expect(view.textContent).toContain(firstStore.storeName);
    expect(view.querySelector('select')).toBeNull();
    expect(view.querySelector('tbody')?.textContent).toContain(voucher.code);
  });

  it('allows retrying a failed store request and a failed voucher request', () => {
    fixture.detectChanges();
    http.expectOne(storesUrl).flush(null, { status: 500, statusText: 'Server error' });
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Gagal memuat toko');

    findButton('Coba lagi').click();
    http.expectOne(storesUrl).flush([firstStore]);
    http.expectOne(vouchersUrl).flush(null, { status: 500, statusText: 'Server error' });
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Gagal memuat voucher toko');

    findButton('Muat ulang').click();
    http.expectOne(vouchersUrl).flush([]);
    fixture.detectChanges();
    expect(view.textContent).toContain('Belum ada voucher di toko ini.');
    expect(findButton('+ Buat Voucher Baru').disabled).toBeFalse();
  });

  it('validates the form and keeps the draft after a duplicate-code conflict', () => {
    loadSingleStore([]);

    findButton('+ Buat Voucher Baru').click();
    fixture.detectChanges();
    enterValue('voucher-code', '  PromoBaru  ');
    enterValue('voucher-percentage', '10.5');
    enterValue('voucher-max-discount', '25000');

    findButton('Terbitkan Voucher').click();
    fixture.detectChanges();
    http.expectNone(vouchersUrl);
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('bilangan bulat');

    enterValue('voucher-percentage', '10');
    findButton('Terbitkan Voucher').click();
    const request = http.expectOne({ method: 'POST', url: vouchersUrl });
    expect(request.request.body).toEqual({
      code: 'PromoBaru', discountPercentage: 10, minPurchaseAmount: 0, maxDiscountAmount: 25000,
    });
    request.flush({ message: 'Kode voucher sudah digunakan.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(view.querySelector('[role="dialog"] [role="alert"]')?.textContent).toContain('Kode voucher sudah digunakan.');
    expect(view.querySelector<HTMLInputElement>('#voucher-code')?.value).toBe('  PromoBaru  ');
    findButton('Terbitkan Voucher').click();
    http.expectOne({ method: 'POST', url: vouchersUrl }).flush(voucher, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(view.querySelector('[role="dialog"]')).toBeNull();
    expect(view.querySelector('tbody')?.textContent).toContain(voucher.code);
  });

  it('applies the saved status and removes a row only after a successful delete', () => {
    loadSingleStore([voucher]);
    const voucherUrl = `${vouchersUrl}/${voucher.id}`;
    const confirmDelete = spyOn(window, 'confirm').and.returnValue(false);
    expect(view.textContent).toContain('1 voucher · 1 aktif');

    findButton('Nonaktifkan').click();
    const update = http.expectOne({ method: 'PATCH', url: voucherUrl });
    fixture.detectChanges();
    expect(findButton('Hapus').disabled).toBeTrue();
    expect(update.request.body).toEqual({ isActive: false });
    expect(view.querySelector('tbody')?.textContent).toContain('Aktif');
    update.flush({ ...voucher, isActive: false });
    fixture.detectChanges();
    expect(findButton('Hapus').disabled).toBeFalse();
    expect(view.querySelector('tbody')?.textContent).toContain('Nonaktif');
    expect(view.textContent).toContain('1 voucher · 0 aktif');

    findButton('Hapus').click();
    http.expectNone(voucherUrl);
    confirmDelete.and.returnValue(true);
    findButton('Hapus').click();
    http.expectOne({ method: 'DELETE', url: voucherUrl }).flush(
      { message: 'Voucher sudah digunakan dalam pesanan. Nonaktifkan voucher ini.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Voucher sudah digunakan dalam pesanan.');
    expect(view.querySelector('tbody')?.textContent).toContain(voucher.code);

    findButton('Hapus').click();
    http.expectOne({ method: 'DELETE', url: voucherUrl }).flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(view.textContent).toContain('Belum ada voucher di toko ini.');
  });
});
