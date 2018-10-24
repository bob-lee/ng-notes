import { Component, ElementRef, Input, isDevMode, OnInit, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

const BOX = 'bl-animate-value-box';
const INNER = 'inner';

@Component({
  selector: 'bl-animate-value',
  template: `
<div class="${BOX}"
  [ngClass]="{'dev':isDevMode}"
  blAnimateValue [prop]="prop" [left]="left">
  <div class="${INNER} enter">{{ propEnter }}</div>
  <div class="${INNER} leave">{{ propLeave }}</div>
</div>
  `,
  styles: [`
.${BOX} {
  display: inline-block;
  position: relative;
  height: 1.5em;
  width: 15em;
  font-size: 1.6rem;
  font-weight: 600;
}
.dev {
  border: 1px red solid;
  border-radius: 0.3em;
}
.${BOX} .${INNER} {
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: flex-start;
}
  `],
})
export class BlHeaderComponent implements OnChanges, OnInit {
  isDevMode = isDevMode();

  propEnter;
  propLeave;

  @Input() prop: string;
  @Input() left: boolean;
  @Input() hostId: string;
  @Input() styles: any;
  @Input() stylesInner: any;

  constructor(private el: ElementRef,
    private renderer: Renderer2) { }

  ngOnInit() {
    const hostId = this.hostId ? `#${this.hostId} ` : '';
    const selector = hostId + `div.${BOX}`;
    const selectorEnter = selector + ` .${INNER}.enter`;
    const selectorLeave = selector + ` .${INNER}.leave`;

    this.applyStyles(selector, this.styles);
    this.applyStyles(selectorEnter, this.stylesInner);
    this.applyStyles(selectorLeave, this.stylesInner);
  }

  private applyStyles(selector: string, styles: any) {
    const box = document.querySelector(selector) as HTMLElement;
    if (!box || !styles) return;

    if (this.isDevMode) console.log(`BlHeaderComponent(${selector}) got`, styles);

    for (const key in styles) {
      box.style[key] = styles[key];
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const prop = changes.prop;
    if (prop) {
      this.propEnter = prop.currentValue;
      this.propLeave = prop.previousValue || '';
    }
  }

}
