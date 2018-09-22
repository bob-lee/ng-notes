import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, useAnimation } from '@angular/animations';
import { MatSnackBar, MatSnackBarRef  } from '@angular/material';
import { Subscription } from 'rxjs';

import { Todo } from './Note';
import { NoteService } from './note.service';
import { WindowRef } from '../service/window-ref.service';
import { routerTransition, expandAnimation, valueUpdated } from '../app.animation';
import { take } from 'rxjs/operators';

/*

0! note can have optional one image file
0. try service worker to process image (e.g. downgrading if too big)
0! make add/edit pages work on refresh: NoteService.getNotePromise()

0! see how onmousedown / onmouseup / click events work on desktop and mobile: long press/touch to edit note
0! on device, touch and scroll up / down on list doesn't work

0. test
0! if another image selected, delete any existing image
0! if img src failed to get, hide it

0. PWA(progressive web app)
0. try React version!

0! footer bar for navigation icons and search
0. animation for router, stagger, add / remove
0! firbase database restructured from nested to flattened
1! Group icon to show note count in the current group
2! Home page to show groups list, Home icon to show group count
3! Home page to go to the selected group when clicked
4. Home <=> Group router animation
5. Stagger animation at page load
6. Add / Remove animation at Group page
7. When coming back from Add / Edit, Group page to scroll to the note position and focus it preferably with animation
8! Relocate 'Add note' button to a fixed position '+'
9! Relocate 'Logout' button to drop down menu beside username
10. Routing changed: OurComponent has 3 children - Groups, Note, NoteForm

*/

@Component({
  templateUrl: './our-notes.component.html',
  styleUrls: ['./our-notes.component.css'],
  animations: [
    routerTransition,
    trigger('expand', [
      transition('* => *', [
        useAnimation(expandAnimation)
      ])
    ]),
    valueUpdated,
  ]
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
