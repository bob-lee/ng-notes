import { Component, OnInit, ElementRef, Input, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { Note, Todo } from '../Note';
import { NoteService } from '../service/note.service';
import { WindowRef } from '../service/window-ref.service';



/* 

0. note can have optional one image file
0. try service worker to process image (e.g. downgrading if too big)
0. make add/edit pages work on refresh

0. test
*/

@Component({
  selector: 'app-our-notes',
  templateUrl: './our-notes.component.html',
  styleUrls: ['./our-notes.component.css']
})
export class OurNotesComponent implements OnInit {
  myForm: FormGroup;
  inside: boolean = false;
  todoEnum = Todo;

  constructor(private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    public noteService: NoteService,
    private windowRef: WindowRef) { }

  ngOnInit() {
    this.myForm = this.formBuilder.group({
      groupName: ['', Validators.required]
    });

    // inspect route
    const group = this.route.snapshot.params['name'];
    console.log('\'OurNotesComponent\'', group, this.route.snapshot);
    if (group) { // route has group name
      this.myForm.controls['groupName'].setValue(group);

      if (group === this.noteService.groupName) {
        console.log('group hasn\'t changed');
        this.init();
      } else {
        this.noteService.search(group)
          .subscribe(notes => {
            this.init();
          },
          error => console.error('searchGroup', error),
          () => console.log(`searchGroup Completed!`)
          );
      }
    } else { // route has no group name
      if (this.windowRef.nativeWindow.localStorage) {
        const previousGroup = this.windowRef.nativeWindow.localStorage.getItem('group');
        if (previousGroup) { // has rememered group name
          console.log('remembered group', previousGroup);
          this.router.navigate(['group', previousGroup]); // redirect to remembered group
          return;
        }
      }

      // exit
      this.noteService.search('');
      this.inside = false;
    }
  }

  add() {
    if (this.editing()) {
      console.log('editing');
      return;
    }
    console.log('add');
    this.router.navigate(['group', this.myForm.controls['groupName'].value, 'add']);
  }

  logInOrOut() {
    this.noteService.logInOrOut()
     .then(() => {
       console.log('logInOrOut', this.noteService.loggedIn);
     })
  }

  searchOrExit() {
    if (this.inside) { // exit
      this.myForm.controls['groupName'].setValue('');
      if (this.windowRef.nativeWindow.localStorage) { // clear group to let, after navigate, ngOnInit find no remembered group and exit
        this.windowRef.nativeWindow.localStorage.setItem('group', '');
      }

      this.inside = false;
      this.router.navigate(['']);
    } else { // search
      if (this.myForm.controls['groupName'].value) {
        this.inside = true;
        this.router.navigate(['group', this.myForm.controls['groupName'].value]);
      }
    }
  }

  private editing() {
    return this.route.snapshot.url.length === 4 || // editing
      (this.route.snapshot.firstChild && this.route.snapshot.firstChild.url[0].path === 'add'); // adding
  }

  private init() {
    this.inside = true;
    console.log('init');
  }

}
