import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';

@Injectable()
export class SellerStoreScopeService {
  readonly storeControl = new FormControl<number | null>(null);
}
