import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { trigger, animate, animation, style, group, animateChild, query, stagger, transition, keyframes, useAnimation } from '@angular/animations';

import { Note, Todo } from '../Note';
import { NoteService } from '../service/note.service';
import { listAnimation } from '../app.animation';
/* 

  <div *ngFor="let note of (noteService.notes | async)" class="notes">
    {{note.name}}, {{note.updatedAt | date : 'dd/MM/yyyy h.mma' | lowercase}} <br/>
    <a [routerLink]="['/group', noteService.groupName, 'edit', note.$key]" routerLinkActive="active">
      {{note.text}}
    </a>
    <hr>
  </div>  

  <ol>
  <li *ngFor="let note of (noteService.notes | async)" class="notes">
    {{note.name}}, {{note.updatedAt | date : 'dd/MM/yyyy h.mma' | lowercase}} <br/>
    <a [routerLink]="['/group', noteService.groupName, 'edit', note.$key]" routerLinkActive="active">
      {{note.text}}
    </a>
    <hr>
  </li>
  </ol>  

    {{ (noteService.notes | async).length }}
    [@listAnimation]="''"
*/

@Component({
  template: `
  <div [@listChild]="noteService.countNotes" class="list">
    <div *ngFor="let note of (noteService.notes | async)" class="item" ontouchstart>
      {{note.name}}, {{note.updatedAt | date : 'dd/MM/yyyy h.mma' | lowercase}} <br/>
      <a [routerLink]="['/group', noteService.groupName, 'edit', note.$key]" >
        {{note.text}}
      </a>
      <hr>
    </div>  
  </div>
  `,
  styleUrls: ['./note.component.css'],
  animations: [
    trigger('listChild', [
      transition('* => *', [
        useAnimation(listAnimation)
      ])
    ])

    /*trigger('listAnimation', [
      transition('void => *', [
        style({ height: '*' }),
        animate(1000, style({ height: 0 }))
      ]),
      transition('* => void', [
        animate(1000, keyframes([
          style({ opacity: 0, transform: 'translateX(-100%)', offset: 0 }),
          style({ backgroundColor: '#bee0ff', opacity: 1, transform: 'translateX(15px)', offset: 0.3 }),
          style({ opacity: 1, transform: 'translateX(0)', offset: 1.0 })
        ]))
      ])
    ])*/
  ]
})
export class NoteComponent implements OnInit {

  constructor(private router: Router,
    private route: ActivatedRoute,
    public noteService: NoteService) { }

  ngOnInit() {
    this.noteService.todo = Todo.List;

    // inspect route
    const group = this.route.snapshot.params['name'];
    console.log(`'NoteComponent' '${group}'`);
    if (group) { // route has group name

      if (group === this.noteService.groupName) {
        console.log('group hasn\'t changed');
      } else {
      }
      this.noteService.search(group);
    }
  }

  private edit(note, e) {
    console.log('edit', new Date(note.updatedAt));

    this.noteService.note = note;
    this.router.navigate(['group', this.noteService.groupName, 'edit', note.$key]);
  }

}
