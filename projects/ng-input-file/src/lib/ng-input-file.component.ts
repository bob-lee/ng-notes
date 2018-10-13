import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GoogleDriveService } from './google-drive.service';

const NO_FILE = '';
const ACCEPT_DEFAULT = 'image/*, video/*';

@Component({
  selector: 'input-file',
  template: `
<div class="box">
  <div class="input-file" style="width:93%">
    <mat-form-field style="width:100%" (click)="inputEl.click()">
      <i matPrefix>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2 12.5C2 9.46 4.46 7 7.5 7H18c2.21 0 4 1.79 4 4s-1.79 4-4 4H9.5C8.12 15 7 13.88 7 12.5S8.12 10 9.5 10H17v2H9.41c-.55 0-.55 1 0 1H18c1.1 0 2-.9 2-2s-.9-2-2-2H7.5C5.57 9 4 10.57 4 12.5S5.57 16 7.5 16H17v2H7.5C4.46 18 2 15.54 2 12.5z"/><path fill="none" d="M0 0h24v24H0V0z"/></svg>
      </i>
      <input matInput placeholder="Choose file" [formControl]="file">
    </mat-form-field>
    <input type="file" [attr.accept]="accept" (change)="fileChanged()" #inputEl>
  </div>
  <i class="icon" *ngIf="service.config" (click)="googleDrivePick()">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48" version="1.1" width="24px" height="24px"><g id="surface1"><path style=" fill:#FFC107;" d="M 17 6 L 31 6 L 45 30 L 31 30 Z "/><path style=" fill:#1976D2;" d="M 9.875 42 L 16.9375 30 L 45 30 L 38 42 Z "/><path style=" fill:#4CAF50;" d="M 3 30.125 L 9.875 42 L 24 18 L 17 6 Z "/></g></svg>
  </i>
  <i class="icon" *ngIf="filename" (click)="remove()">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4z"/><path fill="none" d="M0 0h24v24H0V0z"/></svg>
  </i>
</div>
  `,
  styles: [`
.box {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
mat-form-field, i.icon {
  cursor: pointer;
}
input[type=file] {
  display: none;
}
i[matPrefix] {
  padding-right: 5px;
}
i.icon {
  padding-bottom: 12px;
}
  `],
})
export class NgInputFileComponent {
  file = new FormControl({value: NO_FILE, disabled: true});
  get filename() { return this.file.value; }
  set filename(value) { this.file.setValue(value); }

  @Input() accept = ACCEPT_DEFAULT;
  @Output() files: EventEmitter<any> = new EventEmitter();
  @ViewChild('inputEl')
  private inputEl: ElementRef;
  private googleFile: File;

  constructor(public service: GoogleDriveService) {
    this.service.selectedFile.subscribe(file => this.googleFileChanged(file));
  }

  fileChanged() {
    let filename = NO_FILE;
    if (this.getFiles().length > 0) {
      const file = this.getFiles().item(0);
      if (file) filename = file.name;
    }

    if (this.filename === filename) return;

    // got new file from local device
    this.filename = filename;
    this.googleFile = null;
    this.emitFiles();
  }

  googleFileChanged(file) {
    if (this.service.isDevMode) console.log(`googleFileChanged '${file.name}'`, file);

    if (this.googleFile && 
      this.googleFile.name === file.name && 
      this.googleFile.size === file.size) 
      return;

    // got new file from google drive
    this.filename = file.name;
    this.googleFile = file;
    this.emitFiles();
  }

  googleDrivePick() {
    this.service.loadScript()
      .then(data => this.service.loadPicker())
      .catch(error => console.error('googleDrivePick', error));
  }

  clear() {
    this.getFileInput().value = NO_FILE;
    this.googleFile = null;
    this.filename = NO_FILE;
  }

  remove() {
    this.clear();
    this.emitFiles();
  }

  private emitFiles() {
    const files = this.googleFile ? [this.googleFile] : this.getFiles();
    this.files.emit({ files: files });
  }

  private getFileInput() {
    return this.inputEl.nativeElement;
  }

  private getFiles() {
    return this.getFileInput().files;
  }
}
