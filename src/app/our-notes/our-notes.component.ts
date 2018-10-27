import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarRef  } from '@angular/material';
import { Subscription } from 'rxjs';

import { Todo } from './Note';
import { NoteService } from './note.service';
import { routerTransition, valueUpdated } from '../app.animation';
import { take } from 'rxjs/operators';

@Component({
  templateUrl: './our-notes.component.html',
  styleUrls: ['./our-notes.component.css'],
  animations: [
    routerTransition,
    valueUpdated,
  ],
  //encapsulation: ViewEncapsulation.None // see this makes difference in footer
})
export class OurNotesComponent implements OnInit, OnDestroy {
  inside = false; // source of the truth is 'noteService.groupName'
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

  get debugInfo() { return this.noteService.listState; }

  title = 'Groups';
  helpGroup = 'Group:';
  helpList = 'To create a new group, enter group name below';

  constructor(private router: Router,
    public noteService: NoteService,
    public snackBar: MatSnackBar) { }

  ngOnInit() {

    this.subscription = this.noteService.announcedGroupName.subscribe(
      groupName => {
        setTimeout(_ => { // to avoid ExpressionChangedAfterItHasBeenCheckedError
          this.title = groupName || 'Groups';
          this.inside = !!groupName;
        });
      });
    console.warn(`'OurNotesComponent'`);
  }

  ngOnDestroy() {
    console.warn(`'OurNotesComponent' ngOnDestroy`);
    if (this.subscription) this.subscription.unsubscribe();
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

  getState(outlet) {
    return outlet.activatedRouteData.state;
  }
}
