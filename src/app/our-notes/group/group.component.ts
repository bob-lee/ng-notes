
import { Component,  OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { Todo } from '../Note';
import { NoteService } from '../note.service';
import { LazyLoadService } from 'ng-lazy-load';
import { ModalService } from '../modal.service';
import { listChild } from '../../app.animation';

@Component({
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css'],
  animations: [
    listChild,
  ],
})
export class GroupComponent implements OnInit, OnDestroy {
  trackByFn = (idx, obj) => obj.$key; // do I need this?

  isTouchDevice: boolean;
  subscription: Subscription;
  private init = false;

  @ViewChild('modal')
  public modal;

  constructor(private router: Router,
    private route: ActivatedRoute,
    public noteService: NoteService,
    private lazyLoadService: LazyLoadService,
    private modalService: ModalService) {


    this.subscription = route.params.subscribe(params => {
      if (!this.init) return;

      console.log('GroupComponent params', params);
    })
    console.log('GroupComponent()');
  }

  ngOnInit() {
    // for rtdb, hits here whenever coming back from note-form.
    // for firebase, hits here only once as this component uses note-modal
    this.modalService.setModal(this.modal);

    this.noteService.todo = Todo.List;
    this.isTouchDevice = window.matchMedia('(pointer:coarse)').matches;

    let subscription = this.noteService.announcedLastSaved
      .subscribe(saved => {
        try {
          const savedEl = document.querySelector(`div.item[tabindex="${saved.index}"]`);
          console.log(`announcedLastSaved`, saved);
          if (savedEl && savedEl instanceof HTMLElement) {
            savedEl.focus();
          }
        } catch (e) {
          console.warn(e);
        }
      });
    this.subscription.add(subscription);

    subscription = this.noteService.announcedOrder
      .subscribe(params => this.serveOrder(params));
    this.subscription.add(subscription);

    // inspect route
    const group = this.route.snapshot.params['name'];

    subscription = this.noteService.groupsFs
      .subscribe(_ => console.log(`subscribe to 'groups'`));
    this.subscription.add(subscription);

    console.warn(`'GroupComponent' '${group}' ${this.isTouchDevice}`);
    if (group) { // route has group name

      if (group === this.noteService.groupName) {
        console.log('group hasn\'t changed');
      }

      /* Comparison:
       *  For rtdb, group and note-form are separate sibling routes whereas
       *  for firestore, group is a parent and shows / hides note-modal as needed.
       *  So for firebase, this ngOnInit hits only once when user enter into the group.
      */
      this.noteService.search(group);

      this.init = true;

      this.lazyLoadService.registerAfter(1500);
    }
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
    console.warn(`'GroupComponent' ngOnDestroy`);
  }

  animStart(event) {
  }
  animDone(event) {
    this.noteService.resetListState();
  }

  serveOrder = ({ event, order }) => {
    if (order === 'add') {
      console.log(`add`);
      this.addOrEdit({ event });
    }
  };

  add({ event, done }) {
    console.log(`add`);
    this.addOrEdit({ event });
    done();
  }

  addOrEdit({ event, index = -1, note = undefined }) {
    console.log(`addOrEdit(x:${event.clientX}, i:${index}, key:${note && note.$key || 'na'})`);

    this.noteService.setTheNote(note);
    this.modal.show(event);
  }

  async remove({ note, done }) {
    this.noteService.todo = Todo.Remove;
    await this.noteService.save(note, null, false);
    done();
  }

  toggle() {
    const body = document.querySelector('body');
    body.classList.toggle('show-overlay');
  }

  divScroll(e) {
    console.log('div group', e);
  }

}
