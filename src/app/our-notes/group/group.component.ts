import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { animate, animation, animateChild, group, keyframes, query, stagger, state, style, transition, trigger, useAnimation } from '@angular/animations';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/first';

import { Note, Todo } from '../Note';
import { NoteService } from '../note.service';
import { ModalService } from '../modal.service';
import { listChild } from '../../app.animation';
/* 
; trackBy: trackFbObjects
[@enlarge]="hoverArray[i]"
[@listChild]="noteService.countNotes"
[routerLink]="['/group', noteService.groupName, 'edit', note.$key]"

*/
@Component({
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css'],
  animations: [
    listChild,
    trigger('item', [
      transition('* => modified', [
        animate('1000ms ease-out', keyframes([
          style({ opacity: 1, offset: 0 }),
          style({ opacity: 0, offset: 0.25 }),
          style({ opacity: 1, offset: 0.5 }),
          style({ opacity: 0, offset: 0.75 }),
          style({ opacity: 1, offset: 1 })
        ]))
      ], { delay: 600 }),
    ]),

  ],
  encapsulation: ViewEncapsulation.None
})
export class GroupComponent implements OnInit, OnDestroy {
  trackByFn = (idx, obj) => obj.$key; // do I need this?

  @ViewChild('modal')
  public modal;

  hoverArray = [];
  isTouchDevice: boolean;
  count = 0;
  i;
  subscription: Subscription;
  private init: boolean = false;

  constructor(private router: Router,
    private route: ActivatedRoute,
    public noteService: NoteService,
    private modalService: ModalService) {

    console.log('GroupComponent()');

    this.subscription = route.params.subscribe(params => {
      if (!this.init) return;
      if (this.noteService.database == 1) return;
      console.log('GroupComponent params', params);
      if (params.page) this.noteService.gotoPage(+params.page);
    })

  }

  ngOnInit() { // for rtdb, hits here whenever coming back from note-form. for firebase, hits here only once as this component uses note-modal
    this.modalService.setModal(this.modal);

    this.noteService.todo = Todo.List;
    this.isTouchDevice = window.matchMedia("(pointer:coarse)").matches;

    let subscription = this.noteService.announcedLastSaved
      .subscribe(saved => {
        try {
          const savedEl = document.querySelector(`div.item[tabindex="${saved.index}"]`);
          console.log(`announcedLastSaved`, saved);
          if (savedEl && savedEl instanceof HTMLElement) {
            savedEl.focus();
          }
        } catch (e) {
          console.warn(e);
        }
      });
    this.subscription.add(subscription);

    // inspect route
    const group = this.route.snapshot.params['name'];
    let page = this.route.snapshot.params['page'];
    if (page && page != 1) {
      console.warn(`can't jump into page ${page}, redirecting to first page`);
      page = 1;
      this.router.navigate(['group', group, 1], { queryParams: { db: 2 } }); // ngOnInit won't hit again, just a url change
    }
    const db = this.route.snapshot.queryParams['db'];
    const idxToFocus = this.route.snapshot.queryParams['i'];
    //this.i = idxToFocus;
    const to = this.route.snapshot.queryParams['to'];

    subscription = (db == 1 ? this.noteService.groups : this.noteService.groupsFs)
      .subscribe(_ => console.log(`subscribe to 'groups'`));
    this.subscription.add(subscription);

    console.warn(`'GroupComponent' '${group}' ${page} ${idxToFocus} ${to} ${this.isTouchDevice}`);
    if (group) { // route has group name

      if (group === this.noteService.groupName) {
        console.log('group hasn\'t changed');
      }

      /* Comparison:
       *  For rtdb, group and note-form are separate sibling routes whereas
       *  for firestore, group is a parent and shows / hides note-modal as needed.
       *  So for firebase, this ngOnInit hits only once when user enter into the group.
      */
      const notes$ = this.noteService.search(group, db, page);

      if (db == 1) { // rtdb
        notes$.first().subscribe(
          notes => {
            console.log(`GroupComponent got ${notes.length} note(s) ${this.count}`);
            this.init = true;
            if (this.count++ > 0 || db == 2) return;
  
            this.focusItem(notes, idxToFocus, to);
          }
        );
  
      } else { // firestore
        this.init = true;
      }
    }
  }

  ngOnDestroy() {
    console.warn(`'GroupComponent' ngOnDestroy`);
    if (this.subscription) this.subscription.unsubscribe();
  }

  addOrEdit({ event, index = -1, note = undefined }) {
    console.log(`addOrEdit(x:${event.clientX}, i:${index}, key:${note && note.$key || 'na'})`);
    if (this.noteService.database == 1) {
      if (note) { // edit
        this.noteService.note = note;
        this.router.navigate(['group', this.noteService.groupName, 'rtdb', 'edit', note.$key],
          { queryParams: { i: index } });
      } else { // add
        this.router.navigate(['group', this.noteService.groupName, 'rtdb', 'add']/*, { queryParams: { db: database } }*/);
      }
    } else {
      this.noteService.setTheNote(note);
      this.modal.show(event);
    }
  }

  private focusItem(notes: any[], idxToFocus, to) { // for rtdb
    for (let i = 0, len = notes.length; i < len; i++) {
      const status = idxToFocus == -1 && i === (len - 1) ? "added" :
        idxToFocus == i && to == 2 ? "edited" :
          "loaded";
      this.hoverArray[i] = status;
      if (status !== 'loaded') this.i = i;
    }

    if (idxToFocus) {
      setTimeout(_ => {
        const elements = document.querySelectorAll('div.item');
        const len = elements.length;
        console.log(`GroupComponent rendered ${len} note(s)`);
        if (len > 0) {
          const i = (idxToFocus == -1 || idxToFocus == len) ? (len - 1) : // focus last one
            (idxToFocus >= 0 && idxToFocus < len) ? idxToFocus : // focus specified one
              -1; // do nothing

          console.log(`GroupComponent to focus [${i}]`);
          if (i > -1) {
            const el = elements[i] as HTMLElement;

            el.focus();

            if (this.isTouchDevice) {
              /* on ios chrome, just calling focus() doesn't seem to scroll.

              */
              el.scrollIntoView();
            }

          }
        }
      }, 0);
    }
  }

  gotoPage(next: boolean) {
    const newPage = this.noteService.getPageNumber(next);
    this.router.navigate(['group', this.noteService.groupName, newPage], { queryParams: { db: 2 } });
  }

  remove(note) {
    this.noteService.todo = Todo.Remove;
    this.noteService.save(note, null, false);
  }

  toggle() {
    const body = document.querySelector("body");
    //const body = document.querySelector("div.overlay");
    body.classList.toggle('show-overlay');
  }

  togglePagination() {
    if (this.noteService.pagination) {
      this.router.navigate(['group', this.noteService.groupName], { queryParams: { db: this.noteService.database } });
    } else {
      this.router.navigate(['group', this.noteService.groupName, 1], { queryParams: { db: this.noteService.database } });
    }
  }
}
