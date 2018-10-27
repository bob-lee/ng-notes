import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NoteService } from '../our-notes/note.service';
import { WindowRef } from '../service/window-ref.service';
import { valueUpdated } from '../app.animation';

@Component({
  selector: 'bl-footer',
  template: `
<footer class="bl-footer" [ngClass]="{ 'visible' : visible }">
  <div class="bl-icon" touchStart
    [ngClass]="{'bl-icon-selected': !noteService.inside}" (click)="exit()">
		<div class="bl-icon-title">
      Home
    </div>
		<div class="bl-icon-count">
      <div class="bl-icon-count-inner" [@valueUpdated]="noteService.countGroupsFs">
        <div *ngFor="let num of [ noteService.countGroupsFs ]">{{ num }}</div>
      </div>
    </div>
		<div class="mat-icon-box">
      <mat-icon [inline]="true">home</mat-icon>
    </div>
  </div>

  <div class="bl-icon" touchStart
    [ngClass]="{'bl-icon-selected': noteService.inside}">
		<div class="bl-icon-title">
      Group
    </div>
		<div class="bl-icon-count">
      <div class="bl-icon-count-inner" [@valueUpdated]="noteService.countNotes">
        <div *ngFor="let num of [ noteService.countNotes ]">{{ num }}</div>
      </div>
    </div>
		<div class="mat-icon-box">
      <mat-icon [inline]="true">group</mat-icon>
    </div>
  </div>

  <div class="bl-icon" touchStart>
		<div class="bl-icon-title">
      GitHub
    </div>
		<div class="svg-box">
        <a href="https://github.com/bob-lee/ng-notes">
          <svg aria-hidden="true" version="1.1" viewBox="0 0 16 16" width="36" height="36">
            <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
        </a>
      </div>
  </div>

  <div>
    <form [formGroup]="myForm" (submit)="search()">
      <input type="text" maxlength="30" placeholder="Enter group name"
        [attr.disabled]="noteService.inside ? '' : null" formControlName="groupName" />
    </form>
  </div>
</footer>
  `,
  styleUrls: ['./footer.component.css'],
  animations: [
    valueUpdated,
  ],
  //encapsulation: ViewEncapsulation.None
})
export class FooterComponent implements OnInit {
  myForm: FormGroup;
  _visible: boolean;
  @Input()
  set visible(value: boolean) {
    this._visible = value;
    console.warn(`'FooterComponent' visible setter`, this.visible);
  }
  get visible() { return this._visible; }

  get groupName() { return this.myForm ? this.myForm.controls['groupName'].value : ''; }
  @Input()
  set groupName(value) {
    this.myForm && this.myForm.controls['groupName'].setValue(value);
  }

  constructor(private formBuilder: FormBuilder,
    private router: Router,
    public noteService: NoteService,
    private windowRef: WindowRef) { }

  ngOnInit() {
    this.myForm = this.formBuilder.group({
      groupName: ['', Validators.required]
    });

    console.warn(`'FooterComponent'`, this.visible);
  }

  exit() {
    if (this.windowRef.nativeWindow.localStorage) { // clear group to let, after navigate, ngOnInit find no remembered group and exit
      this.windowRef.nativeWindow.localStorage.setItem('group', '');
    }

    this.router.navigate(['group']);
  }

  search() {
    console.log(`search(${this.groupName})`);
    this.router.navigate(['group', this.groupName], { queryParams: { db: 2 } }); // create / search a group in firestore
  }
}

