import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { trigger, animate, animation, style, group, animateChild, query, stagger, transition, keyframes, useAnimation } from '@angular/animations';

import { Note, Todo } from '../Note';
import { NoteService } from '../note.service';
import { listAnimation } from '../../app.animation';
/*
ontouchstart => #ontouchstart
*/
@Component({
  template: `
  <div [@listChild]="noteService.countGroups" class="list">
    <div *ngFor="let group of (noteService.groups | async)" class="item" >
      <a [routerLink]="['/group', group.$key]" class="item-link">
        {{group.$key}}
      </a>
      <hr>
    </div>
  </div>
  `,
  styleUrls: ['./groups.component.css'],
  animations: [
    trigger('listChild', [
      transition('* => *', [
        useAnimation(listAnimation)
      ])
    ])
  ]
})
export class GroupsComponent implements OnInit {

  constructor(private router: Router,
    public noteService: NoteService) { }

  ngOnInit() {
    console.log(`'GroupsComponent'`);
    this.noteService.todo = Todo.List;

    this.noteService.exit();
  }

}
