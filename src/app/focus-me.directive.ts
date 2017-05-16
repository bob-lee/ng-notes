import { Directive, ElementRef, Input } from '@angular/core';

@Directive({ selector: '[blFocusMe]' })
export class FocusMeDirective {
  constructor(el: ElementRef) {
    setTimeout(() => el.nativeElement.focus(), 500);
  }
}