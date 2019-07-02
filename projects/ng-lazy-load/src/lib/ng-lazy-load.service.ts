import { Inject, Injectable, isDevMode, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Observable } from 'rxjs';

export enum IntersectionState {
  NotRegistered, // initial state
  Registered,
  Listening,
  NotIntersecting,
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
  isBrowser: boolean;
  isDevMode = isDevMode();
  isSimpleMode: boolean = true; // if true, emit only Intersecting and later states that will cause loading
                                // if false, emit Registered, Listening states as well

  setDevMode() { this.isDevMode = true; }
  log = (s?: any, ...optional: any[]) => s && this.isDevMode && console.log(s, optional);
  
  private _loadAheadCount = LOAD_AHEAD_COUNT;
  get loadAheadCount() { return this._loadAheadCount; }
  set loadAheadCount(value: number) {
    this._loadAheadCount = value;
    this.log(`loadAheadCount set to (${value})`);
  }

  delayMsec = 0;

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

  isCompatibleBrowser: boolean;

  private hasCompatibleBrowser(): boolean {
    const hasIntersectionObserver = 'IntersectionObserver' in window;
    const userAgent = window.navigator.userAgent;
    const matches = userAgent.match(/Edge\/(\d*)\./i);

    const isEdge = !!matches && matches.length > 1;
    const isEdgeVersion16OrBetter = isEdge && (!!matches && parseInt(matches[1], 10) > 15);

    const isCompatibleBrowser = hasIntersectionObserver && (!isEdge || isEdgeVersion16OrBetter);
    this.log(`hasCompatibleBrowser`, hasIntersectionObserver, userAgent, isEdge, isEdgeVersion16OrBetter, isCompatibleBrowser);

    return isCompatibleBrowser;
  }

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isCompatibleBrowser = this.isBrowser && this.hasCompatibleBrowser();
    this.log(`'LazyLoadService' loadAheadCount`, this._loadAheadCount, this.isCompatibleBrowser);
  }
}
