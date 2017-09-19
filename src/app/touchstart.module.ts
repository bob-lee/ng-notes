import { NgModule } from '@angular/core';
import { Directive, ElementRef, Input } from '@angular/core';

@Directive({ selector: '[touchStart]' })
export class TouchStartDirective {
  constructor(el: ElementRef) {
    // passive listener
    el.nativeElement.addEventListener('touchstart', function() {}, {passive: true});
    console.warn(`'touchStart'`);
  }
}

@NgModule({
  exports: [ TouchStartDirective ],
  declarations: [ TouchStartDirective ],
})
export class TouchStartModule {}