import { Directive, ElementRef, EventEmitter, HostBinding, 
  HostListener, Output  } from '@angular/core';
import { BusyService } from './service/busy.service';

@Directive({ selector: '[idleClick]' })
export class IdleClickDirective {
  @Output() idleClick: EventEmitter<any> = new EventEmitter();
  @HostBinding('class.loader-3') loading: boolean;
  @HostListener('click', ['$event'])
  onClick(e) {
    if (this.busyService.busy) {
      console.warn('busy');
      return;
    } else {
      console.warn('click');
      this.busyService.set();
      this.timer = setTimeout(_ => { 
        if (this.busyService.busy) 
          this.loading = true; 
      }, 1000);
      this.idleClick.emit({ event: e, done: this.done });
    }
  }
  private timer;

  constructor(private busyService: BusyService, 
    el: ElementRef) { }

  done = () => {
    this.busyService.reset();
    this.loading = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.warn('done');
  };

}
