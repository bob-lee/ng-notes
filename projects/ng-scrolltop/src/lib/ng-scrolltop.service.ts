import { Injectable, isDevMode } from '@angular/core';

const DEFAULT_SCROLLED_PX = 500;

@Injectable({
  providedIn: 'root'
})
export class NgScrolltopService {
  isDevMode = isDevMode();
  isWindow = typeof window !== 'undefined';
  _init = false;
  private _elementToScroll: HTMLElement;
  private _host: any; // scrolling window by default or element if [elementId] is given
  private lastY = 0;
  private ticking = false;

  get currentPositionY(): number {
    return this._elementToScroll ? this._elementToScroll.scrollTop : window.pageYOffset;
  }
  get info(): number { return Math.ceil(this.lastY); }
  get showIcon(): boolean { return this.isWindow && this.lastY > DEFAULT_SCROLLED_PX; }

  setDevMode() { this.isDevMode = true; }
  log = (s?: any, ...optional: any[]) => s && this.isDevMode && console.log(s, optional);

  constructor() { }

  init(elementId: string) {
    if (this.isWindow) {
      this.destroy();

      this._elementToScroll = null;
      if (elementId) {
        this._elementToScroll = document.querySelector(`#${elementId}`) as HTMLElement;
      }

      this._host = this._elementToScroll || window;
      this._host.addEventListener('scroll', this.handleScroll);

      this.log(`'NgScrolltopService' to use ${this._elementToScroll ? 'element' : 'window'}`, elementId || '');
    }

    this._init = true;
  }

  destroy() {
    this.isWindow && this._host && this._host.removeEventListener('scroll', this.handleScroll);
  }

  scrollABit(newY) {
    if (this._elementToScroll) {
      this._elementToScroll.scrollTop = newY;
    } else {
      window.scroll(0, newY);
    }
  }

  private handleScroll = (e) => {
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        this.updateLastY()
        this.ticking = false
      })
      this.ticking = true
    }
  }

  private updateLastY() {
    if (!this._init) return;

    const newY = this.currentPositionY
    if (newY !== this.lastY) {
      this.lastY = newY;
    }
  }
}
