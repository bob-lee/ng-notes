import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { MatIconModule } from '@angular/material/icon';
import { NgScrolltopComponent } from './ng-scrolltop.component';
import { NgScrolltopDirective } from './ng-scrolltop.directive';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
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
