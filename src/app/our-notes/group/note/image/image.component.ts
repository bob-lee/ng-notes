import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'my-image',
  template: `
  <canvas #canvas></canvas>
  `,
  styles: [`
  canvas {
    width: 100%;
  }
  `],
})
export class ImageComponent implements OnInit {
  @Input() source: any;
  @Input() orientation = 1;
  @ViewChild('canvas') canvas: ElementRef;

  constructor() { }

  ngOnInit() {
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

      ctx.drawImage(img, 0, 0);

    });
    img.src = this.source;
  }

}
