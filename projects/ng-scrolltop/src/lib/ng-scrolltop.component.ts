import { Component, Input, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'scrolltop',
  template: `
<div class="scroll-top" blScrolltop
  [ngClass]="{'show-icon': showIcon}">
  <mat-icon>skip_next</mat-icon>
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
    `],
})
export class NgScrolltopComponent implements OnInit, OnDestroy {
  @Input() bottom: string;
  @Input() background: string;
  isWindow: boolean = typeof window !== 'undefined';
  lastY: number = 0;
  ticking: boolean = false;

  get currentPositionY(): number { return window.pageYOffset; }
  get info(): number { return Math.ceil(this.lastY); }
  get showIcon(): boolean { return this.isWindow && this.lastY > 500; }

  updateLastY() {
    const newY = this.currentPositionY
    if (newY !== this.lastY) {
      this.lastY = newY
    }
  }

  handleScroll = (e) => {
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        this.updateLastY()
        this.ticking = false
      })
      this.ticking = true
    }
  }

  constructor() { }

  ngOnInit() {
    this.isWindow && window.addEventListener('scroll', this.handleScroll);

    const element = document.querySelector("div.scroll-top") as HTMLElement;
    if (this.bottom) {
      element.style.bottom = this.bottom;
    }
    if (this.background) {
      element.style.background = this.background;
    }
  }

  ngOnDestroy() {
    this.isWindow && window.removeEventListener('scroll', this.handleScroll);
  }

}


