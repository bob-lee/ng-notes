import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarRef  } from '@angular/material';
import { Subscription } from 'rxjs';

import { Todo } from './Note';
import { NoteService } from './note.service';
import { WindowRef } from '../service/window-ref.service';
import { routerTransition, valueUpdated } from '../app.animation';
import { take } from 'rxjs/operators';

@Component({
  templateUrl: './our-notes.component.html',
  styleUrls: ['./our-notes.component.css'],
  animations: [
    routerTransition,
    valueUpdated,
  ],
})
export class OurNotesComponent implements OnInit, OnDestroy {
  myForm: FormGroup;
  inside = false;
  todoEnum = Todo;
  subscription: Subscription;
  @ViewChild('logoutTemplate') logoutTemplate: TemplateRef<any>;
  snackBarRef: MatSnackBarRef<any>;
  userPhotoLoaded = true;
  imageError(event) {
    this.userPhotoLoaded = false;
    console.log('imageError', event);
  }
  get photoUrl() { return this.noteService.userPhotoUrl; }
  get toShow() { return this.photoUrl && this.userPhotoLoaded; }

  get title(): string { return this.inside ? this.noteService.groupName : 'Groups'; }
  get debugInfo() { return this.noteService.listState; }

  constructor(private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    public noteService: NoteService,
    public snackBar: MatSnackBar,
    private windowRef: WindowRef) { }

  ngOnInit() {
    this.myForm = this.formBuilder.group({
      groupName: ['', Validators.required]
    });

    this.subscription = this.noteService.announcedGroupName.subscribe(
      groupName => {
        console.log(`OurNotesComponent announcedGroupName '${groupName}'`);
        this.myForm.controls['groupName'].setValue(groupName);
        setTimeout(_ => {
          this.inside = !!groupName;
          if (this.inside)
            setTimeout(_ => { this.noteService.showIcon = true; }, 500);
        });
      });

    console.warn(`'OurNotesComponent'`);
  }

  ngOnDestroy() {
    console.warn(`'OurNotesComponent' ngOnDestroy`);
    if (this.subscription) this.subscription.unsubscribe();
  }

  add({ event, done }) { // moved from group.component in favor of animation
    console.log(`add`);
    this.noteService.add(event);
    done();
  }

  exit() {
    if (this.windowRef.nativeWindow.localStorage) { // clear group to let, after navigate, ngOnInit find no remembered group and exit
      this.windowRef.nativeWindow.localStorage.setItem('group', '');
    }

    this.noteService.showIcon = false;
    setTimeout(_ => this.router.navigate(['group']), 500);
  }

  async logout() {
    await this.noteService.logout();
    this.router.navigate(['/']);
  }

  private getSnackBar(simple: boolean): MatSnackBarRef<any> {
    return simple ?
      this.noteService.openSnackBar(`Logged in as ${this.noteService.userName}`, 'Log out') :
      this.noteService.openSnackBarTemplate(this.logoutTemplate);
  }

  async logoutSnackbar({ event, done }) {
    const simple = true;
    console.log(`logoutSnackbar`, simple);

    this.snackBarRef = this.getSnackBar(simple);
    const dismiss = this.snackBarRef.afterDismissed().subscribe(_ => {
      console.log('Snackbar dismissed');
      done();
    });
    let toAction = false;
    await this.snackBarRef.onAction().pipe(take(1))
      .forEach(_ => {
        toAction = true;
        dismiss.unsubscribe();
        console.log('User confirmed to log out');
      });
    if (toAction) {
      await this.noteService.logout();
      done();
      this.router.navigate(['/']);
    }
  }

  logoutSnackbarTemplateAction() {
    console.log('logoutSnackbarTemplateAction');
    this.snackBarRef.dismissWithAction();
  }

  search() {
    const group = this.myForm.controls['groupName'].value;
    console.log(`search(${group})`);
    this.router.navigate(['group', group], { queryParams: { db: 2 } }); // create / search a group in firestore
  }

  getState(outlet) {
    return outlet.activatedRouteData.state;
  }
}
