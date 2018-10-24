import { Injectable, isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class NgIdleClickService {
  isDevMode = isDevMode();

  private _busy: boolean;
  get busy(): boolean { return this._busy; }

  constructor() {
    if (this.isDevMode) console.warn(`'NgIdleClickService'`);
  }

  set() { this._busy = true; }
  reset() { this._busy = false; }
}
