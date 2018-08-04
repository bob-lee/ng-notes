import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Todo } from '../Note';
import { NoteService } from '../note.service';

@Component({
  template: `
  <div class="list" touchStart>
    <div *ngFor="let group of noteService.groupsFs | async" class="item" (click)="goto(group,2)" >
      <a class="item-link">
        {{group.$key}}
      </a>
      <hr>
    </div>
  </div>
  `,
  styleUrls: ['./groups.component.css'],
  animations: [
  ]
})
export class GroupsComponent implements OnInit {

  constructor(private router: Router,
    public noteService: NoteService) {

    this.noteService.todo = Todo.List;
    this.noteService.exit();
  }

  ngOnInit() {
    console.log(`'GroupsComponent'`);

  }

  goto(group, database: number = 1) {
    if (database == 1) { // rtdb
      this.router.navigate(['group', group.$key], { queryParams: { db: database } });
    } else { // firestore
      this.router.navigate(['group', group.$key], { queryParams: { db: database } }); // no pagination by default
    }
  }

}
