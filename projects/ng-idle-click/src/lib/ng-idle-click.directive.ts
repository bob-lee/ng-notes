import { Directive, EventEmitter, HostBinding, 
  HostListener, Input, Output  } from '@angular/core';
import { NgIdleClickService } from './ng-idle-click.service';

@Directive({ selector: '[idleClick]' })
export class NgIdleClickDirective {
  @Input() debugLog: boolean = false;
  @Output() idleClick: EventEmitter<any> = new EventEmitter();
  @HostBinding('class.my-loader') loading: boolean;
  @HostListener('click', ['$event'])
  onClick(e) {
    if (this.busyService.busy) {
      if (this.debugLog) console.warn('busy');
      return;
    } else {
      if (this.debugLog) console.warn('click');
      this.busyService.set();
      this.timer = setTimeout(_ => { 
        if (this.busyService.busy) 
          this.loading = true; 
      }, 1000);
      this.idleClick.emit({ event: e, done: this.done });
    }
  }
  private timer;

  constructor(private busyService: NgIdleClickService) { }

  done = () => {
    this.busyService.reset();
    this.loading = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.debugLog) console.warn('done');
  };
}
