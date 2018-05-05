import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { trigger, animate, animation, style, group, animateChild, query, stagger, transition, keyframes, useAnimation } from '@angular/animations';

import { Note, Todo } from '../Note';
import { NoteService } from '../note.service';
import { listAnimation, listChild } from '../../app.animation';
/*
[routerLink]="['/group', group.$key]"
[@listChild]="noteService.countGroups"
  <pre>rtdb has {{noteService.countGroups}} group(s)</pre>
  <pre>firesotre has {{noteService.countGroupsFs}} group(s)</pre>
*/
@Component({
  template: `
  <pre>firesotre has {{noteService.countGroupsFs}} group(s)</pre>
  <div class="list" touchStart>
    <div *ngFor="let group of noteService.groupsFs | async" class="item" (click)="goto(group,2)" >
      <a class="item-link">
        {{group.$key}}
      </a>
      <hr>
    </div>
  </div>
  <pre>rtdb has {{noteService.countGroups}} group(s)</pre>
  <div class="list" touchStart>
    <div *ngFor="let group of noteService.groups | async" class="item" (click)="goto(group)" >
      <a class="item-link">
        {{group.$key}}
      </a>
      <hr>
    </div>
  </div>
  `,
  styleUrls: ['./groups.component.css'],
  animations: [
    //listChild,
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

  goto(group, database: number = 1) {
    if (database == 1) { // rtdb
      this.router.navigate(['group', group.$key], { queryParams: { db: database } });
    } else { // firestore
      this.router.navigate(['group', group.$key], { queryParams: { db: database } }); // no pagination by default
    }
  }
  
}
