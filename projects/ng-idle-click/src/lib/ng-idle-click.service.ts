import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class NgIdleClickService {

  constructor() {
    console.warn(`'NgIdleClickService'`); // watch when / how often the service is instantiated
  }

  private _busy: boolean;
  get busy(): boolean { return this._busy; }

  set() { this._busy = true; }
  reset() { this._busy = false; }
}
