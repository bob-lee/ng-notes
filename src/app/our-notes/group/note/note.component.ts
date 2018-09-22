import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NoteService } from '../../note.service';

@Component({
  selector: 'my-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css']
})
export class NoteComponent {
  @Input() note: any;
  @Output() toAddOrEdit: EventEmitter<any> = new EventEmitter();
  @Output() toRemove: EventEmitter<any> = new EventEmitter();

  constructor(private noteService: NoteService) { }

  edit({ event, done }) {
    console.log(`edit`);
    this.doEdit(event, -1, this.note);
    done();
  }

  remove({ event, done }) {
    console.log(`remove`);

    const ref = this.noteService.openSnackBar('Do you want to remove this note permanently?', 'Remove');
    const dismiss = ref.afterDismissed().subscribe(_ => {
      done();
      console.log('Snackbar dismissed');
    });
    ref.onAction().subscribe(_ => {
      dismiss.unsubscribe();
      console.log('User confirmed to remove');
      this.doRemove(this.note, done);
    })
  }

  private doEdit(event, index: number, note: any) {
    this.toAddOrEdit.emit({ event, index, note });
  }

  private doRemove(note, done) {
    this.toRemove.emit({ note, done });
  }
}
