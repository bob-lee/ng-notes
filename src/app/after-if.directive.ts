import { Directive, Output, AfterContentInit, EventEmitter } from '@angular/core';

@Directive({ selector: '[afterIf]' })
export class AfterIfDirective implements AfterContentInit {
  @Output('afterIf') after: EventEmitter<AfterIfDirective> = new EventEmitter();

  ngAfterContentInit() {
    setTimeout(_ => this.after.next(this));
  }
}
