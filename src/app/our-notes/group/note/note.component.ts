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

  addOrEdit(event, index: number, note: any) {
    this.toAddOrEdit.emit({ event, index, note });
  }

  remove(note) {
    this.toRemove.emit(note);
  }
}
