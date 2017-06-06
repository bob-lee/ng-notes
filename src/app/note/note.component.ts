import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { Note, Todo } from '../Note';
import { NoteService } from '../service/note.service';
// (click)="edit(note, $event)" onclick=""

@Component({
  selector: 'note',
  template: `
  <div *ngFor="let note of (noteService.notes | async)" 
    (click)="click($event)" 
    (mousedown)="start($event, note)" 
    (touchstart)="start($event, note)" 
    (mouseout)="cancel($event)" 
    (touchend)="cancel($event)" 
    (touchleave)="cancel($event)" 
    (touchcancel)="cancel($event)" 
    class="notes">
    {{note.name}}, {{note.updatedAt | date : 'dd/MM/yyyy h.mma' | lowercase}} <br/>
    {{note.text}}
    <hr>
  </div>  
  `,
  styleUrls: ['./note.component.css']
})
export class NoteComponent implements OnInit {
  longpress = false;
  presstimer = null;
  longtarget = null;

  constructor(private router: Router,
    public noteService: NoteService) { }

  ngOnInit() {
    console.log('\'NoteComponent\'');
    this.noteService.todo = Todo.List;
  }

  private edit(note, e) {
    console.log('edit', new Date(note.updatedAt), e);

    this.noteService.note = note;
    this.router.navigate(['group', this.noteService.groupName, 'edit', note.$key]);
  }

  // long press/touch, https://stackoverflow.com/a/27413909/588521
  start(e, note) {
    console.log(`start ${e.type}`);
    if (e.type === "click" && e.button !== 0) return;
    this.longpress = false;
    //this.classList.add("longpress");
    this.presstimer = setTimeout(() => {
      //alert("long click");
      this.edit(note, e);
      this.longpress = true;
    }, 750);

    return false;
  }

  click(e) {
    console.log(`click ${e.type}`);

    if (this.presstimer !== null) {
      clearTimeout(this.presstimer);
      this.presstimer = null;
    }
    //this.classList.remove("longpress");
    if (this.longpress) return false;
    // alert("press");
  }

  cancel(e) {
    console.log(`cancel ${e.type}`);

    if (this.presstimer !== null) {
      clearTimeout(this.presstimer);
      this.presstimer = null;
    }
    //this.classList.remove("longpress");
  }
}
