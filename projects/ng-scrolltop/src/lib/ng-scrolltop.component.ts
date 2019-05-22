import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgScrolltopService } from './ng-scrolltop.service';

const setElementStyle = (elem: HTMLElement, name: string, value: string) => {
  if (elem && name) {
    elem.style[name] = value || '';
  }
}

@Component({
  selector: 'scrolltop',
  template: `
<div class="scroll-top" blScrolltop
  [ngClass]="{'show-icon': service.showIcon}">
  <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="sizeInner" [attr.height]="sizeInner" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
</div>

<div class="scroll-top dev" *ngIf="service.isDevMode">
  {{service.info}}
</div>
  `,
  styles: [`
  .scroll-top {
    position: fixed;
    bottom: 12px;
    left: 12px;
    height: 48px;
    width: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: #333;
    transform: rotate(-90deg);
    opacity: 0;
    visibility: hidden;
    transition: visibility 1.0s linear, opacity 1.0s linear;
  }
  .scroll-top:hover {
    cursor: pointer;
  }
  .scroll-top.show-icon {
    visibility: visible;
    opacity: 0.3;
  }
  .scroll-top.dev {
    bottom: 150px;
    visibility: visible;
    opacity: 0.5;
    transform: none;
    color: #fff;
  }
    `],
})
export class NgScrolltopComponent implements OnInit, OnDestroy {
  private icon: HTMLElement;
  private svg: HTMLElement;
  private _bottom: string;
  private _background: string;
  private _elementId: string;
  private _fill: string;
  private _size: string = '48px';

  @Input()
  set bottom(value: string) {
    this._bottom = value;
    setElementStyle(this.icon, 'bottom', value);
  }
  @Input()
  set background(value: string) {
    this._background = value;
    setElementStyle(this.icon, 'background', value);
  }
  @Input()
  set elementId(value: string) {
    this._elementId = value;
    this.service.init(value);
  }
  @Input() 
  set size(value: string) {
    this._size = value;
    setElementStyle(this.icon, 'width', value);
    setElementStyle(this.icon, 'height', value);
  }
  @Input() sizeInner: string = '24';
  @Input() 
  set fill(value: string) {
    this._fill = value;
    setElementStyle(this.svg, 'fill', value);
  }

  constructor(public service: NgScrolltopService) { }

  ngOnInit() {

    this.service.init(this._elementId);

    this.icon = document.querySelector('div.scroll-top:not(.dev)') as HTMLElement;
    this.svg = document.querySelector('div.scroll-top:not(.dev) svg') as HTMLElement;
    if (this.icon) {
      setElementStyle(this.icon, 'bottom', this._bottom);
      setElementStyle(this.icon, 'background', this._background);
      setElementStyle(this.icon, 'width', this._size);
      setElementStyle(this.icon, 'height', this._size);
      setElementStyle(this.svg, 'fill', this._fill);
    } else {
      this.service.log(`NgScrolltopComponent failed to find icon element, so any inputs will be ignored`);
    }

    this.service.log(`NgScrolltopComponent(${this.service.isWindow}, ${this._bottom}, ${this._background}, ${this._elementId})`, this.icon && this.icon.style);
  }

  ngOnDestroy() {
    this.service.destroy();
  }
}
