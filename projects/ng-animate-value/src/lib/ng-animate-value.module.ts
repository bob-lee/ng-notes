import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlHeaderComponent } from './ng-animate-value.component';
import { AnimateValueDirective } from './ng-animate-value.directive';
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    BlHeaderComponent,
    AnimateValueDirective,
  ],
  exports: [
    BlHeaderComponent,
    AnimateValueDirective,
  ]
})
export class NgAnimateValueModule { }
