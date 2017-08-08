import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { animate, animation, animateChild, group, keyframes, query, stagger, state, style, transition, trigger, useAnimation } from '@angular/animations';

import { Note, Todo } from '../Note';
import { NoteService } from '../note.service';
import { itemAnimation, listAnimation } from '../../app.animation';
/* 
; trackBy: trackFbObjects
[@enlarge]="hoverArray[i]"
[@listChild]="noteService.countNotes"
[routerLink]="['/group', noteService.groupName, 'edit', note.$key]"
*/
@Component({
  template: `
  <div [@listChild]="noteService.countNotes" class="list">
    <div *ngFor="let note of (noteService.notes | async); let i = index" 
      [@enlarge]="hoverArray[i]" class="item" ontouchstart [attr.tabindex]="i">
      {{note.name}}, {{note.updatedAt | date : 'dd/MM/yyyy h.mma' | lowercase}} 
      <span (click)="remove(note)" style="cursor:pointer" class="glyphicon glyphicon-trash" aria-hidden="true"></span> 
      <br/>
      <a (click)="edit(note, i, $event)">
        <markdown>
          {{note.text}}
        </markdown>
      </a>
      <hr>
    </div>  
  </div>
  <button class="fab" (click)="add()">+</button>
  `,
  styleUrls: ['./group.component.css'],
  animations: [
    trigger('listChild', [
      transition('* => *', [
        //useAnimation(listAnimation)
        query(':enter', [
          style({ transform: 'scale(0)', opacity: 0 })
        ], { optional: true }),
        query(':leave', [
          style({ opacity: 1, height: '5em' }),
          animate('1s ease-out', style({ opacity: 0, height: 0 }))
        ], { optional: true }),
        query(':enter', [
          animate('500ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
        ], { optional: true })

      ])
    ]),

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
  trackFbObjects = (idx, obj) => obj.$key; // do I need this?
  hoverArray = [];

  constructor(private router: Router,
    private route: ActivatedRoute,
    public noteService: NoteService) { }

  ngOnInit() {
    this.noteService.todo = Todo.List;

    // inspect route
    const group = this.route.snapshot.params['name'];
    const idxToFocus = this.route.snapshot.queryParams['i'];
    const to = this.route.snapshot.queryParams['to'];
    console.log(`'GroupComponent' '${group}' ${idxToFocus} ${to}`);
    if (group) { // route has group name

      if (group === this.noteService.groupName) {
        console.log('group hasn\'t changed');
      }

      this.noteService.search(group).subscribe(
        notes => {
          console.log(`GroupComponent gets ${notes.length} note(s)`);
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
                  el.scrollIntoView(); // ios chrome seems to need this
                  el.focus();
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
