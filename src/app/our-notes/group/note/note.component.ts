import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'my-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css']
})
export class NoteComponent {
  @Input() note: any;
  @Output() toAddOrEdit: EventEmitter<any> = new EventEmitter();
  @Output() toRemove: EventEmitter<any> = new EventEmitter();

  constructor() { }

  edit({ event, done }) {
    console.log(`edit`);
    this.doEdit(event, -1, this.note);
    done();
  }

  remove({ event, done }) {
    console.log(`remove`);
    this.doRemove(this.note, done);
  }

  private doEdit(event, index: number, note: any) {
    this.toAddOrEdit.emit({ event, index, note });
  }

  private doRemove(note, done) {
    this.toRemove.emit({ note, done });
  }
}
