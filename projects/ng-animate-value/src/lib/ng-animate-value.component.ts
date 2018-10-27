import { Component, ElementRef, Input, isDevMode, OnInit, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

const BOX = 'bl-animate-value-box';
const INNER = 'inner';

@Component({
  selector: 'bl-animate-value',
  template: `
<div class="${BOX}"
  [ngClass]="{'dev':isDevMode}"
  blAnimateValue [prop]="prop" [left]="left">
  <div class="${INNER} enter">
    <div class="box" [attr.data-help]="helpEnter">
      {{ propEnter }}
    </div>
  </div>
  <div class="${INNER} leave">
    <div class="box" [attr.data-help]="helpLeave">
      {{ propLeave }}
    </div>
  </div>
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
.box {
  position: relative;
}
.box::before {
  content: attr(data-help);
  font-size: 0.4em;
  font-weight: normal;
  position: absolute;
  top: -.8em;
  width: 40em;
}
  `],
})
export class BlHeaderComponent implements OnChanges, OnInit {
  isDevMode = isDevMode();

  propEnter;
  propLeave;
  helpEnter;
  helpLeave;

  hostId: string;

  @Input() helpLeft ='';
  @Input() helpRight = '';

  @Input() prop: string;
  @Input() left: boolean;
  @Input() styles: any;
  @Input() stylesInner: any;

  constructor(private el: ElementRef,
    private renderer: Renderer2) { }

  ngOnInit() {
    const idAttr = this.el.nativeElement.attributes.getNamedItem('id');
    this.hostId = idAttr && idAttr.value || '';

    const findId = this.hostId ? `#${this.hostId} ` : '';
    const selector = findId + `div.${BOX}`;
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
      this.helpEnter = this.left ? this.helpLeft : this.helpRight;
      this.propLeave = prop.previousValue || '';
      this.helpLeave = this.left ? this.helpRight : this.helpLeft;
    }
  }

}
