import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ProductListComponent } from './product-list.component';

describe('ProductListComponent', () => {
  let fixture: ComponentFixture<ProductListComponent>;
  let http: HttpTestingController;
  let view: HTMLElement;
  const productsUrl = `${environment.apiUrl}/seller/products`;
  const categoriesUrl = `${environment.apiUrl}/categories`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    fixture = TestBed.createComponent(ProductListComponent);
    http = TestBed.inject(HttpTestingController);
    view = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  function product(id: number, stock: number) {
    return {
      id,
      storeId: 2,
      productName: 'Produk ' + id,
      productPrice: 2500,
      productStock: stock,
      productCategories: [{ categoryId: 3 }, { categoryId: 5 }],
    };
  }

  function expectProducts(page = '1', search: string | null = null, categoryId: string | null = null) {
    const request = http.expectOne(req => req.method === 'GET' && req.url === productsUrl);
    expect(request.request.params.get('page')).toBe(page);
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('search')).toBe(search);
    expect(request.request.params.get('categoryId')).toBe(categoryId);
    return request;
  }

  it('renders all product categories and marks zero and low stock', () => {
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush([
      { id: 3, categoryName: 'Elektronik' },
      { id: 5, categoryName: 'Aksesoris' },
    ]);
    expectProducts().flush([product(1, 0), product(2, 5), product(3, 6)]);
    fixture.detectChanges();

    const rows = view.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Elektronik, Aksesoris');
    expect(rows[0].textContent).toContain('Habis');
    expect(rows[1].textContent).toContain('Stok menipis');
    expect(rows[2].textContent).not.toContain('Stok menipis');
    expect(rows[0].querySelector('a')?.getAttribute('href')).toBe('/seller/products/1');
  });

  it('paginates and cancels stale requests when the search or category changes', fakeAsync(() => {
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush([{ id: 3, categoryName: 'Elektronik' }]);
    expectProducts().flush(Array.from({ length: 20 }, (_, index) => product(index + 1, 10)));
    fixture.detectChanges();
    tick();

    view.querySelectorAll<HTMLButtonElement>('nav button')[1].click();
    const secondPage = expectProducts('2');
    const search = view.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'kab';
    search.dispatchEvent(new Event('input'));
    expect(secondPage.cancelled).toBeTrue();
    tick(200);

    search.value = '  kabel  ';
    search.dispatchEvent(new Event('input'));
    tick(299);
    http.expectNone(req => req.url === productsUrl);
    tick(1);
    const searchRequest = expectProducts('1', 'kabel');

    const select = view.querySelector<HTMLSelectElement>('select')!;
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    expect(searchRequest.cancelled).toBeTrue();
    expectProducts('1', 'kabel', '3').flush([]);
    fixture.detectChanges();
    expect(view.textContent).toContain('Tidak ada produk yang cocok');
  }));

  it('shows a load error and lets the seller retry to a genuinely empty catalog', () => {
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush([]);
    expectProducts().flush(null, { status: 500, statusText: 'Server error' });
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Gagal memuat produk toko');

    view.querySelector('header button')!.dispatchEvent(new MouseEvent('click'));
    expectProducts().flush([]);
    fixture.detectChanges();
    expect(view.textContent).toContain('Belum ada produk di toko Anda');
    expect(view.querySelector('tbody')).toBeNull();
  });

  it('shows an error when the seller endpoint rejects the session', () => {
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush([]);
    expectProducts().flush(null, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(view.querySelector('[role="alert"]')).not.toBeNull();
    expect(view.querySelector('tbody')).toBeNull();
  });

  it('keeps the row when deletion fails and refreshes only after success', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush([]);
    expectProducts().flush([product(4, 5)]);
    fixture.detectChanges();

    const deleteUrl = `${environment.apiUrl}/products/4`;
    view.querySelector<HTMLButtonElement>('tbody button')!.click();
    const failed = http.expectOne({ method: 'DELETE', url: deleteUrl });
    expect(view.querySelector('tbody tr')?.textContent).toContain('Produk 4');
    failed.flush(null, { status: 500, statusText: 'Server error' });
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Gagal menghapus');
    expect(view.querySelector('tbody tr')?.textContent).toContain('Produk 4');

    view.querySelector<HTMLButtonElement>('tbody button')!.click();
    http.expectOne({ method: 'DELETE', url: deleteUrl }).flush(null, { status: 204, statusText: 'No Content' });
    expectProducts().flush([]);
    fixture.detectChanges();
    expect(view.querySelector('tbody')).toBeNull();
  });
});
