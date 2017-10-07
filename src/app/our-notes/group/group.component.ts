import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { animate, animation, animateChild, group, keyframes, query, stagger, state, style, transition, trigger, useAnimation } from '@angular/animations';
import 'rxjs/add/operator/first';

import { Note, Todo } from '../Note';
import { NoteService } from '../note.service';
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

    trigger('enlarge', [
      state('void', style({ transform: 'scale(0)', opacity: 0.0, 'z-index': 1 })),
      state('loaded', style({ transform: 'scale(1)', opacity: 1.0, 'z-index': 1 })),
      state('edited', style({ transform: 'scale(1)', opacity: 1.0, 'z-index': 1 })),
      state('added', style({ transform: 'scale(1)', opacity: 1.0, 'z-index': 1 })),
      transition('* => added', [
        animate('1000ms ease-out')
      ]),
      transition('* => edited', [
        animate('700ms ease-out'/*,         keyframes([
          style({opacity: 1, offset: 0}),
          style({opacity: 0, offset: 0.25}),
          style({opacity: 1, offset: 0.5}),
          style({opacity: 0, offset: 0.75}),
          style({opacity: 1, offset: 1})
        ])*/
        )
      ]),
    ])
  ]
})
export class GroupComponent implements OnInit {
  trackFbObjects = (idx, obj) => obj.$key; // do I need this?
  hoverArray = [];
  isTouchDevice: boolean;
  count = 0;

  constructor(private router: Router,
    private route: ActivatedRoute,
    public noteService: NoteService) { }

  ngOnInit() {
    this.noteService.todo = Todo.List;
    this.isTouchDevice = window.matchMedia("(pointer:coarse)").matches;

    // inspect route
    const group = this.route.snapshot.params['name'];
    const idxToFocus = this.route.snapshot.queryParams['i'];
    const to = this.route.snapshot.queryParams['to'];
    console.warn(`'GroupComponent' '${group}' ${idxToFocus} ${to} ${this.isTouchDevice}`);
    if (group) { // route has group name

      if (group === this.noteService.groupName) {
        console.log('group hasn\'t changed');
      }

      this.noteService.search(group).first().subscribe(
        notes => {
          console.log(`GroupComponent gets ${notes.length} note(s) ${this.count}`);
          if (this.count++ > 0) return;

          for (let i = 0, len = notes.length; i < len; i++) {
            this.hoverArray[i] = idxToFocus == -1 && i === (len - 1) ? "added" :
              idxToFocus == i && to == 2 ? "edited" :
                "loaded";
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
      );

    }
  }

  add() {
    console.log('add');
    this.router.navigate(['group', this.noteService.groupName, 'add']);
  }

  private edit(note, index, event) {
    console.log(`edit ${note.$key} ${index} screenY=${event.screenY} clientY=${event.clientY}`);

    this.noteService.note = note;
    this.router.navigate(['group', this.noteService.groupName, 'edit', note.$key],
      { queryParams: { i: index } });
  }

  remove(note) {
    this.noteService.todo = Todo.Remove;
    this.noteService.save(note, null, false);
  }

}
