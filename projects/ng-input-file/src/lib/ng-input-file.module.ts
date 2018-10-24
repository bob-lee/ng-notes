import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatInputModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';

import { NgInputFileComponent } from './ng-input-file.component';
import { GoogleDriveService } from './google-drive.service';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
  ],
  providers: [GoogleDriveService],
  declarations: [NgInputFileComponent],
  exports: [NgInputFileComponent]
})
export class NgInputFileModule { }
