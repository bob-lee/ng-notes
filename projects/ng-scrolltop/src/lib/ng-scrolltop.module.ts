import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgScrolltopComponent } from './ng-scrolltop.component';
import { NgScrolltopDirective } from './ng-scrolltop.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    NgScrolltopComponent,
    NgScrolltopDirective,
  ],
  exports: [
    NgScrolltopComponent,
    NgScrolltopDirective,
  ]
})
export class NgScrolltopModule { }
