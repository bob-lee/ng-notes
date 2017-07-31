import { Component, OnInit, ElementRef, HostBinding, Input, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { trigger, animate, animation, style, group, animateChild, query, stagger, transition, keyframes, useAnimation } from '@angular/animations';

import { Note, Todo } from '../Note';
import { NoteService } from '../service/note.service';
import { WindowRef } from '../service/window-ref.service';
import { itemAnimation, listAnimation } from '../app.animation';

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
  selector: 'app-our-notes',
  templateUrl: './our-notes.component.html',
  styleUrls: ['./our-notes.component.css'],
  /*animations: [
    trigger('pageAnimation', [
      // for staggering animation at initial load
      transition(':enter', [ 
        useAnimation(itemAnimation)
      ]),
      
      // for a single item animation after load
      transition('* => *', [ // each time the binding value changes
        //query(':enter', [useAnimation(itemAnimation)], { optional: true })
        useAnimation(listAnimation)
      ])
    ])
  ]*/

})
export class OurNotesComponent implements OnInit {
  myForm: FormGroup;
  inside: boolean = false;
  todoEnum = Todo;

  // @HostBinding('@pageAnimation') 
  // get count (): number { return this.noteService.countNotes; } 

  //get atHome(): boolean { return this.noteService.groupName ? false : true; }
  //get atGroup(): boolean { return !this.atHome; }
  get title(): string { return this.inside ? 'Our notes' : 'Groups'; }

  constructor(private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    public noteService: NoteService,
    private windowRef: WindowRef) { }

  ngOnInit() {
    this.myForm = this.formBuilder.group({
      groupName: ['', Validators.required]
    });

    this.noteService.announcedGroupName.subscribe(
      groupName => {
        console.log(`OurNotesComponent announcedGroupName '${groupName}'`);
        this.myForm.controls['groupName'].setValue(groupName);
        this.inside = groupName ? true : false;
      });

    // inspect route // 31Jul17 route should be always '/group'
    console.log(`'OurNotesComponent'`);
    /*
    const group = this.route.snapshot.params['name'];
    console.log(`'OurNotesComponent' '${group}'`);
    if (group) { // route has group name
      this.myForm.controls['groupName'].setValue(group);

      if (group === this.noteService.groupName) {
        console.log('group hasn\'t changed');
        this.init();
      } else {
        this.noteService.search(group).subscribe(
          notes => this.init(),
          error => console.error('searchGroup', error));
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
    */
  }

  add() {
    // if (this.editing()) {
    //   console.log('editing');
    //   return;
    // }
    console.log('add');
    this.router.navigate(['group', this.myForm.controls['groupName'].value, 'add']);
  }

  logInOrOut() {
    this.router.navigate(['/']);
    this.noteService.logout();
  }

  search() {
    const group = this.myForm.controls['groupName'].value;
    console.log(`search(${group})`);
    this.router.navigate(['group', group]);
  }

  exit() {
    //this.myForm.controls['groupName'].setValue('');
    if (this.windowRef.nativeWindow.localStorage) { // clear group to let, after navigate, ngOnInit find no remembered group and exit
      this.windowRef.nativeWindow.localStorage.setItem('group', '');
    }

    //this.inside = false;
    this.router.navigate(['group']);
  }
/*
  private editing() {
    console.log('editing()', this.route.snapshot);
    return this.route.snapshot.url.length === 4 || // editing
      (this.route.snapshot.firstChild && this.route.snapshot.firstChild.url[0].path === 'add'); // adding
  }

  private init(notes?) {
    this.inside = true;
    console.log('init');
  }
*/
}
