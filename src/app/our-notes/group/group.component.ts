import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { trigger, animate, animation, style, group, animateChild, query, stagger, transition, keyframes, useAnimation } from '@angular/animations';

import { Note, Todo } from '../Note';
import { NoteService } from '../note.service';
import { listAnimation } from '../../app.animation';
/* 

[routerLink]="['/group', noteService.groupName, 'edit', note.$key]"
*/
@Component({
  template: `
  <div [@listChild]="noteService.countNotes" class="list">
    <div *ngFor="let note of (noteService.notes | async); let i = index" class="item" ontouchstart tabindex="0">
      {{note.name}}, {{note.updatedAt | date : 'dd/MM/yyyy h.mma' | lowercase}} <br/>
      <a (click)="edit(note, i, $event)">
        <markdown>
          {{note.text}}
        </markdown>
      </a>
      <hr>
    </div>  
  </div>
  `,
  styleUrls: ['./group.component.css'],
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
export class GroupComponent implements OnInit {

  constructor(private router: Router,
    private route: ActivatedRoute,
    public noteService: NoteService) { }

  ngOnInit() {
    this.noteService.todo = Todo.List;

    // inspect route
    const group = this.route.snapshot.params['name'];
    const idxToFocus = this.route.snapshot.queryParams['i'];
    console.log(`'GroupComponent' '${group}' ${idxToFocus}`);
    if (group) { // route has group name

      if (group === this.noteService.groupName) {
        console.log('group hasn\'t changed');
      }
      
      this.noteService.search(group).subscribe(
        notes => {
          console.log(`GroupComponent gets ${notes.length} note(s)`);
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
                }
              }
            }, 0);
          }
        }
      );

    }
  }

  private edit(note, index, event) {
    console.log(`edit ${note.$key} ${index} screenY=${event.screenY} clientY=${event.clientY}`);

    this.noteService.note = note;
    this.router.navigate(['group', this.noteService.groupName, 'edit', note.$key],
      { queryParams: { i: index } });
  }

}
