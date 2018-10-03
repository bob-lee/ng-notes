import { Component, Input, Output, ElementRef, EventEmitter, OnDestroy } from '@angular/core';
import { NoteService } from '../../note.service';
import { LazyLoadService, IntersectionState } from 'ng-lazy-load';
import { Subscription } from 'rxjs';

const LOAD_AHEAD_COUNT = 0;

@Component({
  selector: 'my-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css']
})
export class NoteComponent implements OnDestroy {
  @Input() note: any;
  @Input() index: number;
  @Output() toAddOrEdit: EventEmitter<any> = new EventEmitter();
  @Output() toRemove: EventEmitter<any> = new EventEmitter();
  toLoad = false; // local state for lazy-loading offscreen images
  private _subcription: Subscription;

  get imageURL() { 
    return this.toLoad && this.note.imageURL && this.note.imageURL.indexOf('images') > -1 ? this.note.imageURL : ''; 
  }
  get videoURL() { 
    return this.toLoad && this.note.imageURL && this.note.imageURL.indexOf('videos') > -1 ? this.note.imageURL : ''; 
  }

  constructor(private el: ElementRef,
    private noteService: NoteService,
    private lazyLoadService: LazyLoadService) {

    this._subcription = this.lazyLoadService.announcedIntersection.subscribe(params => {
      const { index, state } = params;
      if (!this.toLoad && (this.index - index) <= LOAD_AHEAD_COUNT) {
        this.toLoad = true;
        console.log(`(${index},${IntersectionState[state]}) loading [${this.index}]`);
      }
    });
  }

  ngOnDestroy() {
    if (this._subcription) {
      this._subcription.unsubscribe();
    }
  }

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
    if (!this.noteService.isOwner) {
      done();
      return;
    }
    this.toRemove.emit({ note, done });
  }

  doLoad(state: IntersectionState, index) {
    this.toLoad = state > IntersectionState.None;
    console.log(`doLoad [${index}] ${IntersectionState[state]}`);
  }


}
/*
const STORAGE_IMAGE_FOLDER = 'images';
const STORAGE_VIDEO_FOLDER = 'videos';

getFilename(url) { // returns 'Sarah.jpg' or 'bunny.mp4'
if (url) {
  const downloadUrl = url.indexOf('firebasestorage.googleapis.com'); // or signedUrl with 'storage.googleapis.com'
  const END_MATCHER = downloadUrl > -1 ? '?alt=' : '?GoogleAccessId=';
  let begin = url.indexOf(`/${STORAGE_IMAGE_FOLDER}`); // .../images%2f or .../images/
  if (begin === -1) begin = url.indexOf(`/${STORAGE_VIDEO_FOLDER}`); // .../videos%2f or .../videos/
  const end = url.indexOf(END_MATCHER);
  //console.log(`getFilename(${downloadUrl},${END_MATCHER},${begin},${end})`)
  if (begin > -1 && end > -1) {
    const skip = url[begin + 7] === '%' ? 10 : 8;
    return url.slice(begin + skip, end);
  } else {
    //return url;
    throw `getFilename() got invalid url: ${url}`;
  }
}
return null;
}
*/