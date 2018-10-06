import { Injectable, isDevMode } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export enum IntersectionState {
  Disconnected,
  None,
  Intersecting,
  NearIntersecting,
  Visible,
  Prerender
}

const LOAD_AHEAD_COUNT = 2;

@Injectable({
  providedIn: 'root'
})
export class LazyLoadService {
  isDevMode = isDevMode();

  private _loadAheadCount = LOAD_AHEAD_COUNT;
  get loadAheadCount() { return this._loadAheadCount; }
  set loadAheadCount(value: number) {
    this._loadAheadCount = value; 
    if (this.isDevMode) console.log(`loadAheadCount set to (${value})`);
  }

  delayMsec = 0;
  registerAfter(msec: number) {
    if (msec > 0) {
      this.delayMsec = msec;
      setTimeout(_ => this.announceOrder('register'), msec);
    }
  }
  registerLater() {
    this.delayMsec = 1; // let the directive not register on init
  }
  registerAll() {
    this.announceOrder('register');
  }
  
  // announce order to [lazyLoad] directives
  private order$ = new Subject<string>();
  announcedOrder = this.order$.asObservable();
  announceOrder(name: string) {
    this.order$.next(name);
  }

  // announce intersecting index to [lazyLoad] directives
  private intersection$ = new Subject<any>(); 
  announcedIntersection = this.intersection$.asObservable();
  announceIntersection(params: object) { // { index: number, state: IntersectionState }
    this.intersection$.next(params);
  }

  constructor() {
    if (this.isDevMode) console.log(`'LazyLoadService' loadAheadCount`, this._loadAheadCount);
  }
}
