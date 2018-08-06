import { Component, OnInit, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { animate, group, query, style, transition, trigger } from '@angular/animations';

import { Todo } from '../Note';
import { NoteService } from '../note.service';
import { WindowRef } from '../../service/window-ref.service';

const zoomFadeIn = { opacity: 0, transform: 'translateX({{ x }}) translateY({{ y }}) scale(0)' };
// const zoomFadeInFrom = { ...zoomFadeIn, transformOrigin: '{{ ox }} {{ oy }}' };
// export function zoomFadeInFrom() { return { ...zoomFadeIn, transformOrigin: '{{ ox }} {{ oy }}' }; };
export function easeInFor(duration) { return `${duration}ms cubic-bezier(0.35, 0, 0.25, 1)`; };

const handlerScroll = e => {
  console.log(e);
  e.preventDefault();
  e.stopPropagation();
  return false;
};
const scroll = function (e) {
  console.log(e.type, e.target);
  e.preventDefault(); // how to eat up scroll event to prevent parent scrolling on modal popup???
  return false;
};

@Component({
  selector: 'note-modal',
  templateUrl: './note-modal.component.html',
  styleUrls: ['./note-modal.component.css'],
  animations: [
    trigger('overlay', [
      transition(':enter', [
        style({ opacity: 0 }),
        // query('.container', [style(zoomFadeInFrom)]),
        query('.container', [style({ opacity: 0, transform: 'translateX({{ x }}) translateY({{ y }}) scale(0)', transformOrigin: '{{ ox }} {{ oy }}' })]),
        group([
          animate(easeInFor(150), style({ opacity: 1 })),
          query('.container', animate(easeInFor(450), style('*'))),
        ]),
      ], { params: { x: '0px', y: '0px', ox: '50%', oy: '50%' } }),
      transition(':leave', group([
        animate(300, style({ opacity: 0 })),
        query('.container', [
          animate(300, style(zoomFadeIn))
        ])
      ]), { params: { x: '0px', y: '0px', ox: '50%', oy: '50%' } })
    ])
  ],
  encapsulation: ViewEncapsulation.None
})
export class NoteModalComponent implements OnInit {
  title: string;
  @ViewChild('fileInput')
  inputEl: ElementRef;
  busy = false;
  takeLong = false;

  note: any; // reference to noteService.theNote set in init()
  noteForm: FormGroup;
  submitted = false;
  imgToRemove = false;
  _fileChanged = false; // selected or removed
  imageFailedToLoad = false; // to indicate the case where the given image url failed to load
  /*
  note that it does not subscribe to value changes of this form.
  on button click, form value is checked and then manually taken to model.
  */

  data = {
    value: 'inactive',
    params: {
      x: null,
      y: null,
      ox: null,
      oy: null
    }
  };

  popup;
  body;
  html;

  constructor(private formBuilder: FormBuilder,
    private noteService: NoteService,
    private windowRef: WindowRef) { }

  ngOnInit() {
    console.log(`'NoteModalComponent'`);

    this.noteForm = this.formBuilder.group({
      name: ['', Validators.required],
      text: ['', Validators.required]
    });
    this._fileChanged = false;
  }

  private goBack() {
    this.hide();
  }

  async save(e) {
    e.stopPropagation();
    console.log(`save ${this.noteForm.status} changed=${this.changed()}, ${this.inputEl && this.inputEl.nativeElement.files.length} file(s), imgToRemove=${this.imgToRemove}`);
    if (this.noteForm.invalid) {
      this.submitted = true;
      return;
    }

    if (this.changed()) {
      // take form value to model
      this.note.name = this.noteForm.value.name;
      this.note.text = this.noteForm.value.text;

      await this.saveNote(this.imgToRemove);
    } else { // no change, go back without making server call
      this.noteService.todo = Todo.List;
    }

    this.goBack();
  }

  cancel(e) {
    this.hide();
  }

  fileSelected() {
    this._fileChanged = true;
    console.log(`fileSelected ${this.inputEl.nativeElement.files.length} file(s), imgToRemove=${this.imgToRemove}`);
  }

  removeFile(e) {
    if (this.inputEl) this.inputEl.nativeElement.value = ''; // remove any selected file
    this.imgToRemove = true; // hide any downloaded image
    this._fileChanged = true;
    console.log(`removeFile ${this.inputEl && this.inputEl.nativeElement.files.length} file(s), imgToRemove=${this.imgToRemove}`);
  }

  get toHideButton(): boolean {
    if (this.noteService.theNoteHasImage) return false; // show button
    if (this.inputEl && this.inputEl.nativeElement.files.length > 0) return false; // show button
    return true; // hide button
  }

  get toHideImg(): boolean {
    if (this.imgToRemove || this.imageFailedToLoad) return true; // hide image
    if (this.noteService.theNoteHasImage && this.inputEl && this.inputEl.nativeElement.files.length > 0) return true; // hide image
    if (!this.noteService.theNoteHasImage) return true; // hide image
    return false; // show image
  }

  private changed() { // compare form value with original note in edit case
    if (this.noteService.todo === Todo.Add) return true; // add
    const orig = this.note;
    const form = this.noteForm.value;
    const changed = form.name !== orig.name || form.text !== orig.text || this._fileChanged || this.imageFailedToLoad;
    return changed;
  }

  private async saveNote(toRemoveExistingImage?: boolean) { // assumes this.note has form value
    this.busy = true;
    setTimeout(_ => { if (this.busy) this.takeLong = true; }, 1000);
    const inputEl: HTMLInputElement = this.inputEl.nativeElement;

    try {
      const data = await this.noteService.save(this.note, inputEl.files, this.imageFailedToLoad, toRemoveExistingImage);
      console.log('saveNote():', data);
    } catch (error) {
      console.error('saveNote():', error);
    }
    this.busy = false;
  }

  loadImage() {
    if (!this.note || !this.note.imageURL) return;
    const isImage = this.note.imageURL.indexOf('images') > -1;
    const isVideo = this.note.imageURL.indexOf('videos') > -1;
    console.log(`imageURL ${this.note.imageURL}, ${isImage}, ${isVideo}`);
    if (isImage) {
      const img = <HTMLImageElement>document.querySelector("#myimg");
      img.addEventListener('load', _ => console.log('image loaded'));
      img.addEventListener('error', error => {
        console.warn('image failed to load', error);
        this.imageFailedToLoad = true;
      });
      img.src = this.note.imageURL;
    } else if (isVideo) {
      const video = <HTMLVideoElement>document.querySelector("#myvideo");
      video.src = this.note.imageURL;
      video.load();
    } else {
      console.warn('loadImage() gave up loading file');
    }
  }

  private init(showing: boolean = true) {
    this.busy = false;
    this.takeLong = false;
    this.body = document.querySelector('body');

    if (showing) {
      this.body.classList.add('noScroll');
      if (!this.noteService.theNote) { // this component assumes the user had called noteService.setTheNote() properly
        console.warn('theNote is not set');
        return;
      }
      this.note = this.noteService.theNote;

      this.title = this.noteService.theNote.$key ? 'Edit note' : 'Add note';
      console.warn(this.title);

      // apply model to view
      this.noteForm.patchValue(this.noteService.theNote);
    } else {
      this.body.classList.remove('noScroll');
      this.note = null;
      this.imgToRemove = false;
      this.imageFailedToLoad = false;
      this._fileChanged = false;
    }
  }

  show(event: any, group: any) {

    this.calculateZoomOrigin(event);
    this.makeVisible();
    this.init();
  }

  private calculateZoomOrigin(event) {
    const clientX = event.clientX;
    const clientY = event.clientY;

    const width = this.windowRef.nativeWindow.innerWidth;
    const height = this.windowRef.nativeWindow.innerHeight;

    this.data.params.x = `${clientX - width / 2}px`;
    this.data.params.y = `${clientY - height / 2}px`;
    this.data.params.ox = `${(clientX / width) * 100}%`;
    this.data.params.oy = `${(clientY / height) * 100}%`;

    //console.log(`zoom(${this.data.params.x}, ${this.data.params.y},${this.data.params.ox},${this.data.params.oy})`);
  }

  private makeVisible() {
    this.data.value = 'active';
  }

  hide() {
    if (this.busy) return;
    this.init(false);

    this.data.value = 'inactive';
    console.log('hide()');
  }

  toggle() {
    this.data.value === 'active' ? this.hide() : this.makeVisible();
  }

}
