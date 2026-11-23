import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ProductDetailComponent } from './product-detail.component';

describe('ProductDetailComponent', () => {
  let fixture: ComponentFixture<ProductDetailComponent>;
  let http: HttpTestingController;
  let navigate: jasmine.Spy;
  let view: HTMLElement;
  const apiUrl = environment.apiUrl;
  const categories = [
    { id: 3, categoryName: 'Elektronik' },
    { id: 5, categoryName: 'Aksesoris' },
  ];
  const productDetails = {
    id: 21,
    storeId: 12,
    store: { id: 12, storeName: 'Toko Seller' },
    productName: 'Kabel Produk',
    productDescription: null,
    productPrice: 2500,
    productStock: 9,
    productCategories: [{ categoryId: 3 }, { categoryId: 5 }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(ProductDetailComponent);
    view = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  afterEach(() => http.verify());

  function start(id?: string) {
    const params = id === undefined ? {} : { id };
    spyOnProperty(TestBed.inject(ActivatedRoute).snapshot, 'paramMap', 'get').and.returnValue(convertToParamMap(params));
    fixture.detectChanges();
  }

  function loadEdit(stock: number | null = 9) {
    http.expectOne(`${apiUrl}/categories`).flush(categories);
    http.expectOne(`${apiUrl}/seller/products/21`).flush({ ...productDetails, productStock: stock });
    fixture.detectChanges();
    tick();
  }

  function submit() {
    view.querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  function enter(id: string, value: string) {
    const input = view.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('waits for categories and stores before creating a product with zero stock', fakeAsync(() => {
    start();
    const categoryRequest = http.expectOne(`${apiUrl}/categories`);
    http.expectOne(`${apiUrl}/seller/stores`).flush([{ id: 12, storeName: 'Toko Seller' }]);
    fixture.detectChanges();
    expect(view.textContent).toContain('Memuat data produk');
    expect(view.querySelector('form')).toBeNull();

    categoryRequest.flush(categories);
    fixture.detectChanges();
    tick();

    enter('product-name', '  Kabel Baru  ');
    enter('product-price', '2500');
    view.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    submit();
    const create = http.expectOne({ method: 'POST', url: `${apiUrl}/products` });
    expect(create.request.serializeBody()).toBe(JSON.stringify({
      storeId: 12, productName: 'Kabel Baru', productPrice: 2500, productStock: 0, categoryIds: [3],
    }));
    create.flush({}, { status: 201, statusText: 'Created' });
    expect(navigate).toHaveBeenCalledWith(['/seller/products']);
  }));

  it('uses the first store automatically when the API returns several stores', fakeAsync(() => {
    start();
    http.expectOne(`${apiUrl}/categories`).flush(categories);
    http.expectOne(`${apiUrl}/seller/stores`).flush([
      { id: 12, storeName: 'Toko Seller' },
      { id: 18, storeName: 'Toko Kedua' },
    ]);
    fixture.detectChanges();
    tick();
    expect(view.textContent).toContain('Toko Seller');
    expect(view.querySelector('select')).toBeNull();

    enter('product-name', 'Kabel Baru');
    enter('product-price', '2500');
    view.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    submit();
    const create = http.expectOne({ method: 'POST', url: `${apiUrl}/products` });
    expect(create.request.body.storeId).toBe(12);
    create.flush({});
  }));

  it('loads all categories and only sends a changed price', fakeAsync(() => {
    start('21');
    loadEdit();
    expect(Array.from(view.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'), input => input.checked))
      .toEqual([true, true]);
    expect(view.textContent).toContain('Toko Seller');

    enter('product-price', '3.000,50');
    submit();
    const update = http.expectOne({ method: 'PUT', url: `${apiUrl}/products/21` });
    expect(update.request.body).toEqual({ productPrice: 3000.5 });
    update.flush({});
    expect(navigate).toHaveBeenCalledWith(['/seller/products']);
  }));

  it('skips the update when the form is returned to its original values', fakeAsync(() => {
    start('21');
    loadEdit();

    enter('product-price', '3000');
    enter('product-price', '2500');
    submit();
    http.expectNone({ method: 'PUT', url: `${apiUrl}/products/21` });
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Belum ada perubahan');
  }));

  it('sends changed categories and both stock values, then handles a conflict in the form', fakeAsync(() => {
    start('21');
    loadEdit();
    view.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    enter('product-stock', '12');
    submit();
    const update = http.expectOne({ method: 'PUT', url: `${apiUrl}/products/21` });
    expect(update.request.body).toEqual({ categoryIds: [5], productStock: 12, expectedStock: 9 });
    update.flush({}, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Data produk sudah berubah');
    expect(view.querySelector<HTMLInputElement>('#product-stock')?.value).toBe('12');
    expect(view.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBeTrue();

    view.querySelector<HTMLButtonElement>('form button[type="button"]')!.click();
    loadEdit(7);
    enter('product-stock', '12');
    submit();
    const retry = http.expectOne({ method: 'PUT', url: `${apiUrl}/products/21` });
    expect(retry.request.body).toEqual({ productStock: 12, expectedStock: 7 });
    retry.flush({});
    expect(navigate).toHaveBeenCalledWith(['/seller/products']);
  }));

  it('sends an explicit null baseline for old products with unknown stock', fakeAsync(() => {
    start('21');
    loadEdit(null);
    enter('product-stock', '0');
    submit();
    const update = http.expectOne({ method: 'PUT', url: `${apiUrl}/products/21` });
    expect(update.request.body).toEqual({ productStock: 0, expectedStock: null });
    update.flush({ message: 'Stok tidak valid.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Stok tidak valid.');
  }));

  it('does not open an editable form when the seller detail is unavailable', () => {
    start('21');
    http.expectOne(`${apiUrl}/categories`).flush(categories);
    http.expectOne(`${apiUrl}/seller/products/21`).flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Produk tidak ditemukan');
    expect(view.querySelector('form')).toBeNull();
  });
});
