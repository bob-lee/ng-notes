import { Component, Input, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { NgScrolltopService } from './ng-scrolltop.service';

@Component({
  selector: 'scrolltop',
  template: `
<div class="scroll-top" blScrolltop
  [ngClass]="{'show-icon': service.showIcon}">
  <mat-icon>skip_next</mat-icon>
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
  private _bottom: string;
  private _background: string;
  private _elementId: string;

  @Input()
  set bottom(value: string) {
    this._bottom = value;
    if (this.icon) {
      this.icon.style.bottom = value;
    }
  }

  @Input()
  set background(value: string) {
    this._background = value;
    if (this.icon) {
      this.icon.style.background = value;
    }
  }
  @Input()
  set elementId(value: string) {
    this._elementId = value;
    this.service.init(value);
  }

  constructor(public service: NgScrolltopService) { }

  ngOnInit() {

    if (!this.service._init) this.service.init(this._elementId);

    this.icon = document.querySelector('div.scroll-top:not(.dev)') as HTMLElement;
    if (this.icon) {
      if (this._bottom) {
        this.icon.style.bottom = this._bottom;
      }
      if (this._background) {
        this.icon.style.background = this._background;
      }
    } else {
      if (this.service.isDevMode) console.warn(`NgScrolltopComponent failed to find icon element, so any inputs will be ignored`);
    }

    if (this.service.isDevMode) console.log(`NgScrolltopComponent(${this.service.isWindow}, ${this._bottom}, ${this._background}, ${this._elementId})`, this.icon && this.icon.style);
  }

  ngOnDestroy() {
    this.service.destroy();
  }
}
