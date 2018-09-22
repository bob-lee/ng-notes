import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

const NO_FILE = '';
const ACCEPT_DEFAULT = 'image/*, video/*';

@Component({
  selector: 'input-file',
  template: `
<div class="box">
  <div class="input-file" style="width:93%">
    <mat-form-field style="width:100%" (click)="inputEl.click()">
      <mat-icon matPrefix>attachment</mat-icon>
      <input matInput placeholder="Choose file" disabled value="{{filename}}">
    </mat-form-field>
    <input type="file" [attr.accept]="accept" (change)="fileChanged()" #inputEl>
  </div>

  <mat-icon (click)="remove()">{{filename ? 'delete_outline' : ''}}</mat-icon>
</div>
  `,
  styles: [`
.box {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
mat-form-field, mat-icon {
  cursor: pointer;
}
input[type=file] {
  display: none;
}
mat-icon[matPrefix] {
  margin-right: 5px;
}
.box > mat-icon {
  margin-bottom: 12px;
}
  `],
})
export class NgInputFileComponent {

  filename = NO_FILE;
  @Input() accept = ACCEPT_DEFAULT;
  @Output() files: EventEmitter<any> = new EventEmitter();
  @ViewChild('inputEl')
  private inputEl: ElementRef;

  fileChanged() {
    let filename = NO_FILE;
    if (this.getFiles().length > 0) {
      const file = this.getFiles().item(0);
      if (file) filename = file.name;
    }

    if (this.filename === filename) return;

    this.filename = filename;
    this.emitFiles();
  }

  clear() {
    this.getFileInput().value = NO_FILE;
    this.filename = NO_FILE;
  }

  remove() {
    this.clear();
    this.emitFiles();
  }

  private emitFiles() {
    this.files.emit({ files: this.getFiles() });
  }

  private getFileInput() {
    return this.inputEl.nativeElement;
  }

  private getFiles() {
    return this.getFileInput().files;
  }
}
