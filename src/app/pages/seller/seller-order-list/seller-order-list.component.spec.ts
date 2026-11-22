import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { OrderResponse } from '../../../models/order.model';
import { SellerOrderListComponent } from './seller-order-list.component';

describe('SellerOrderListComponent', () => {
  let fixture: ComponentFixture<SellerOrderListComponent>;
  let http: HttpTestingController;
  let view: HTMLElement;
  const ordersUrl = environment.apiUrl + '/orders';
  const order: OrderResponse = {
    id: 21,
    userId: 3,
    userName: 'Budi',
    storeId: 2,
    storeName: 'Toko Seller',
    addressId: 5,
    recipientName: 'Penerima',
    voucherId: null,
    voucherCode: null,
    discountAmount: null,
    totalBeforeDisc: 1500,
    totalAfterDisc: null,
    orderStatus: 1,
    createdAt: '2026-11-19T06:15:00Z',
    updatedAt: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SellerOrderListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(SellerOrderListComponent);
    http = TestBed.inject(HttpTestingController);
    view = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  it('shows API totals and counts, then filters locally by status, buyer, and order number', () => {
    fixture.detectChanges();
    expect(view.querySelector('[role="status"]')?.textContent).toContain('Memuat pesanan');
    http.expectOne({ method: 'GET', url: ordersUrl }).flush([
      order,
      { ...order, id: 22, userName: 'Dewi', orderStatus: 0, totalAfterDisc: 0 },
    ]);
    fixture.detectChanges();

    const rows = () => view.querySelectorAll('tbody tr');
    expect(rows()[0].textContent).toContain('13:15 WIB');
    expect(rows()[0].textContent).toContain('Rp 1,500');
    expect(rows()[1].textContent).toContain('Rp 0');
    expect(rows()[0].querySelector('a')?.getAttribute('href')).toBe('/seller/orders/21');
    expect(Array.from(view.querySelectorAll('dd'), count => count.textContent?.trim())).toEqual(['1', '1', '0', '0']);

    const pendingTab = Array.from(view.querySelectorAll('button'))
      .find(button => button.textContent?.trim() === 'Menunggu Pembayaran')!;
    pendingTab.click();
    fixture.detectChanges();
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('ORD-22');

    const search = view.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = '  DEWI  ';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(rows()[0].textContent).toContain('ORD-22');

    search.value = 'ORD-21';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(view.querySelector('[role="status"]')?.textContent).toContain('Tidak ada pesanan yang cocok');

    view.querySelector<HTMLButtonElement>('button[aria-pressed="false"]')!.click();
    fixture.detectChanges();
    expect(rows()[0].textContent).toContain('ORD-21');
  });

  it('shows a load error and can retry to an empty list', () => {
    fixture.detectChanges();
    http.expectOne({ method: 'GET', url: ordersUrl }).flush(null, { status: 500, statusText: 'Server error' });
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Gagal memuat pesanan toko');

    const retry = Array.from(view.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Coba lagi')!;
    retry.click();
    http.expectOne({ method: 'GET', url: ordersUrl }).flush([]);
    fixture.detectChanges();
    expect(view.querySelector('[role="status"]')?.textContent).toContain('Belum ada pesanan masuk');
  });
});
