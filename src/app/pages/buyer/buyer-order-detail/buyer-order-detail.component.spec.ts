import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyerOrderDetailComponent } from './buyer-order-detail.component';

describe('BuyerOrderDetailComponent', () => {
  let component: BuyerOrderDetailComponent;
  let fixture: ComponentFixture<BuyerOrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyerOrderDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BuyerOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
