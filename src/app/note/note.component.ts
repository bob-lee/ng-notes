import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { Note, Todo } from '../Note';
import { NoteService } from '../service/note.service';

@Component({
  selector: 'note',
  template: `
  <div *ngFor="let note of (noteService.notes | async)" (click)="edit(note)" class="notes">
    {{note.name}}, {{note.updatedAt | date : 'dd/MM/yyyy h.mma' | lowercase}} <br/>
    {{note.text}}
    <hr>
  </div>  
  `,
  styleUrls: ['./note.component.css']
})
export class NoteComponent implements OnInit {

  constructor(private router: Router,
    public noteService: NoteService) { }

  ngOnInit() {
    console.log('\'NoteComponent\'');
    this.noteService.todo = Todo.List;
  }

  edit(note) {
    console.log('edit', new Date(note.updatedAt));

    this.noteService.note = note;
    this.router.navigate(['group', this.noteService.groupName, 'edit', note.$key]);
  }
}
