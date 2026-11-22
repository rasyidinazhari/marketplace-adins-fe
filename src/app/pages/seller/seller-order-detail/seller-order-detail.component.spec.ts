import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { OrderDetailResponse, OrderResponse } from '../../../models/order.model';
import { SellerOrderDetailComponent } from './seller-order-detail.component';

describe('SellerOrderDetailComponent', () => {
  let fixture: ComponentFixture<SellerOrderDetailComponent>;
  let http: HttpTestingController;
  let params: BehaviorSubject<ParamMap>;
  let view: HTMLElement;
  const ordersUrl = environment.apiUrl + '/orders';
  const orderUrl = ordersUrl + '/21';
  const order: OrderResponse = {
    id: 21,
    userId: 4,
    userName: 'Budi',
    storeId: 2,
    storeName: 'Toko Seller',
    addressId: 5,
    recipientName: 'Dewi',
    voucherId: 6,
    voucherCode: 'HEMAT',
    discountAmount: 1000,
    totalBeforeDisc: 5000,
    totalAfterDisc: 4000,
    orderStatus: 1,
    createdAt: '2026-11-19T06:15:00Z',
    updatedAt: null,
  };
  const detail: OrderDetailResponse = {
    ...order,
    phoneNumber: '081234567890',
    fullAddress: 'Jalan Melati 7',
    city: 'Jakarta',
    postalCode: '10110',
    items: [{
      id: 1,
      orderId: 21,
      productId: 7,
      productName: 'Kabel USB',
      quantity: 2,
      priceAtPurchase: 2500,
      createdAt: '2026-11-19T06:15:00Z',
      updatedAt: '2026-11-19T06:15:00Z',
    }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SellerOrderDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    params = new BehaviorSubject(convertToParamMap({ id: '21' }));
    spyOnProperty(TestBed.inject(ActivatedRoute), 'paramMap', 'get').and.returnValue(params);
    fixture = TestBed.createComponent(SellerOrderDetailComponent);
    http = TestBed.inject(HttpTestingController);
    view = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  function loadDetail(): void {
    fixture.detectChanges();
    http.expectOne({ method: 'GET', url: orderUrl }).flush(detail);
    fixture.detectChanges();
  }

  it('loads the address, items, and totals together and updates shipping after confirmation', () => {
    const confirm = spyOn(window, 'confirm').and.returnValues(false, true);
    loadDetail();
    expect(view.textContent).toContain('ORD-21');
    expect(view.textContent).toContain('Pembeli Budi');
    expect(view.textContent).toContain('Dewi');
    expect(view.textContent).toContain('081234567890');
    expect(view.textContent).toContain('Jalan Melati 7');
    expect(view.textContent).toContain('Jakarta 10110');
    expect(view.textContent).toContain('HEMAT');
    expect(view.textContent).toContain('Rp 4,000');
    expect(view.querySelector('tbody tr')?.textContent).toContain('Kabel USB');
    expect(view.querySelector('tbody tr')?.textContent).toContain('Rp 5,000');

    const ship = view.querySelector<HTMLButtonElement>('button')!;
    expect(ship.textContent).toContain('Tandai Sudah Dikirim');
    ship.click();
    http.expectNone({ method: 'PATCH' });
    ship.click();
    const patch = http.expectOne({ method: 'PATCH', url: orderUrl });
    expect(patch.request.body).toEqual({ status: 'ON_DELIVERY' });
    fixture.detectChanges();
    expect(ship.disabled).toBeTrue();
    ship.click();
    http.expectNone({ method: 'PATCH' });
    patch.flush({ ...order, orderStatus: 2 });
    fixture.detectChanges();

    expect(confirm).toHaveBeenCalledTimes(2);
    expect(view.textContent).toContain('Dalam Pengiriman');
    expect(view.textContent).toContain('Jalan Melati 7');
    expect(view.querySelector('tbody tr')?.textContent).toContain('Kabel USB');
    expect(view.querySelector('button')).toBeNull();
  });

  it('reloads after a shipping conflict before allowing another update', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    loadDetail();
    view.querySelector<HTMLButtonElement>('button')!.click();
    http.expectOne({ method: 'PATCH', url: orderUrl }).flush(null, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    const [ship, reload] = Array.from(view.querySelectorAll<HTMLButtonElement>('button'));
    expect(ship.disabled).toBeTrue();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Pesanan sudah berubah');
    reload.click();
    http.expectOne({ method: 'GET', url: orderUrl }).flush({ ...detail, orderStatus: 3 });
    fixture.detectChanges();
    expect(view.textContent).toContain('Selesai');
    expect(view.querySelector('button')).toBeNull();
  });

  it('validates the route, cancels stale loads, and shows an unavailable order', () => {
    params.next(convertToParamMap({ id: 'invalid' }));
    fixture.detectChanges();
    http.expectNone(() => true);
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('ID pesanan tidak valid');

    params.next(convertToParamMap({ id: '21' }));
    const stale = http.expectOne({ method: 'GET', url: orderUrl });

    params.next(convertToParamMap({ id: '22' }));
    expect(stale.cancelled).toBeTrue();
    http.expectOne({ method: 'GET', url: ordersUrl + '/22' }).flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Pesanan tidak ditemukan');
    expect(view.querySelector('tbody')).toBeNull();
  });
});
