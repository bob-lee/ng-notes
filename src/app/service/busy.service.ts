import { Injectable } from '@angular/core';

@Injectable()
export class BusyService {
  private _busy: boolean;
  get busy(): boolean { return this._busy; }

  set() { this._busy = true; }
  reset() { this._busy = false; }
}
