import { Injectable, isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class NgIdleClickService {
  isDevMode = isDevMode();

  setDevMode() { this.isDevMode = true; }
  log = (s?: any, ...optional: any[]) => s && this.isDevMode && console.log(s, optional);

  private _busy: boolean;
  get busy(): boolean { return this._busy; }

  constructor() {
    this.log(`'NgIdleClickService'`);
  }

  set() { this._busy = true; }
  reset() { this._busy = false; }
}
