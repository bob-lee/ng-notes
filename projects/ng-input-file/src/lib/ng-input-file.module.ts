import { NgModule } from '@angular/core';
import { MatButtonModule, MatInputModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';

import { NgInputFileComponent } from './ng-input-file.component';

@NgModule({
  imports: [
    MatButtonModule,
    MatInputModule,
    MatIconModule,
  ],
  declarations: [NgInputFileComponent],
  exports: [NgInputFileComponent]
})
export class NgInputFileModule { }
