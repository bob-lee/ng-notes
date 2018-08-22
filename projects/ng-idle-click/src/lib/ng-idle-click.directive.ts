import { Directive, ElementRef, EventEmitter, 
  HostListener, Input, Output, Renderer2, OnInit  } from '@angular/core';
import { NgIdleClickService } from './ng-idle-click.service';

const defaultClassName = 'my-loader';

@Directive({ selector: '[idleClick]' })
export class NgIdleClickDirective implements OnInit {
  @Input() idleClickDebug: boolean = false;
  @Input() idleClickLoader: string = defaultClassName;
  @Output() idleClick: EventEmitter<any> = new EventEmitter();
  @HostListener('click', ['$event'])
  onClick(e) {
    if (this.busyService.busy) {
      if (this.idleClickDebug) console.warn('busy');
      return;
    } else {
      if (this.idleClickDebug) console.warn('click');
      this.busyService.set();
      this.timer = setTimeout(_ => { 
        if (this.busyService.busy) {
          this.renderer.addClass(this.el.nativeElement, this.idleClickLoader);
        }
      }, 1000);
      this.idleClick.emit({ event: e, done: this.done });
    }
  }
  private timer;

  constructor(private busyService: NgIdleClickService, 
    private el: ElementRef,
    private renderer: Renderer2) { }

  ngOnInit() {
    if (this.idleClickDebug) console.log(`NgIdleClickDirective(${this.idleClickLoader})`);
  }

  done = () => {
    this.busyService.reset();
    this.renderer.removeClass(this.el.nativeElement, this.idleClickLoader);

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.idleClickDebug) console.warn('done');
  };
}
