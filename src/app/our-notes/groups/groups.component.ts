import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { trigger, animate, animation, style, group, animateChild, query, stagger, transition, keyframes, useAnimation } from '@angular/animations';

import { Note, Todo } from '../Note';
import { NoteService } from '../note.service';
import { listAnimation, listChild } from '../../app.animation';
/*
[routerLink]="['/group', group.$key]"
[@listChild]="noteService.countGroups"
*/
@Component({
  template: `
  <div class="list" touchStart>
    <div *ngFor="let group of (noteService.groups | async)" class="item" (click)="goto(group)" >
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

  private goto(group) {
    this.router.navigate(['group', group.$key]);
  }
  
}
