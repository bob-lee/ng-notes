import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'my-image',
  template: `
  <loader *ngIf="source && !loaded"></loader>
  <canvas #canvas></canvas>
  `,
  styles: [`
  canvas {
    width: 100%;
  }
  `],
})
export class ImageComponent implements OnInit {
  private _source = '';
  private _init = false;
  loaded = false;

  @Input()
  set source(value: string) {
    if (!value || value === this._source) return;
    this.loaded = false;
    this._source = value.trim();
    if (this._init) this.doLoad(); // source changed runtime, load again
  }
  get source(): string { return this._source; }

  @Input() orientation = 1;
  @ViewChild('canvas') canvas: ElementRef;

  constructor() { }

  ngOnInit() {
    this.doLoad();
    this._init = true;
  }

  private doLoad() {
    const img = new Image();

    img.addEventListener('load', _ => {
      const width = img.width;
      const height = img.height;
      const canvas = this.canvas.nativeElement;
      const ctx = canvas.getContext('2d');

      // set proper canvas dimensions before transform
      if (4 < this.orientation && this.orientation < 9) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }

      // transform context before drawing image
      switch (this.orientation) {
        case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
        case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
        case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
        case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
        case 7: ctx.transform(0, -1, -1, 0, height, width); break;
        case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
        default: break;
      }

      this.loaded = true;
      ctx.drawImage(img, 0, 0);
    });

    img.src = this._source;
  }
}
