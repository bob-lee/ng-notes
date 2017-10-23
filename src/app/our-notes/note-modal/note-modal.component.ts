import { Component, OnInit, Input, Output, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
//import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { animate, group, query, style, transition, trigger } from '@angular/animations';

import { Note, Todo } from '../Note';
import { NoteService } from '../note.service';
//import { AfterIfDirective } from '../after-if.directive';
import { WindowRef } from '../../service/window-ref.service';

const zoomFadeIn = { opacity: 0, transform: 'translateX({{ x }}) translateY({{ y }}) scale(0)' };
const zoomFadeInFrom = { ...zoomFadeIn, transformOrigin: '{{ ox }} {{ oy }}' };
const easeInFor = (duration) => `${duration}ms cubic-bezier(0.35, 0, 0.25, 1)`;

const handlerScroll = e => {
  console.log(e);
  e.preventDefault();
  e.stopPropagation();
  return false;
};
const scroll = function (e) {
  console.log(e.type,e.target);
  e.preventDefault(); // how to eat up scroll event to prevent parent scrolling on modal popup???
  return false;
};
/*
routerLink="/"
*/
@Component({
  selector: 'note-modal',
  templateUrl: './note-modal.component.html',
  styleUrls: ['./note-modal.component.css'],
  animations: [
    trigger('overlay', [
      transition(':enter', [
        style({ opacity: 0 }),
        query('.container', [style(zoomFadeInFrom)]),
        group([
          animate(easeInFor(100), style({ opacity: 1 })),
          query('.container', animate(easeInFor(300), style('*'))),
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
export class NoteModalComponent implements OnInit { // note form modal only for firestore
  title: string;
  @ViewChild('fileInput')
  /*set fileInput(val: ElementRef) {
    this.inputEl = val;
    console.log('fileInput', val);
  }*/

  inputEl: ElementRef;
  //contentInit: boolean = false;

  note: any; // reference to noteService.theNote set in init()
  noteForm: FormGroup;
  submitted: boolean = false;
  imgToRemove: boolean = false;
  _fileChanged: boolean = false; // selected or removed
  imageFailedToLoad: boolean = false; // to indicate the case where the given image url failed to load
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

  save(e) {
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

      this.saveNote(this.imgToRemove);
    } else { // no change, go back without making server call
      this.noteService.todo = Todo.List;
      this.goBack();
    }
    // this.noteService.theNote.name = this.noteForm.value.name;
    // this.noteService.theNote.text = this.noteForm.value.text;

    // this.saveNote();
  }

  cancel(e) {
    this.hide();
  }

  fileSelected() {
    //this.imgToRemove = false;
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
    //if (!this.contentInit) return true;
    //const hideIt = !this.inputEl || this.inputEl.nativeElement.files.length === 0 && this.note && !this.note.imageURL/* && this.note.imageURL !== 'remove'*/;
    //return hideIt as boolean;
    if (this.noteService.theNoteHasImage) return false; // show button
    if (this.inputEl && this.inputEl.nativeElement.files.length > 0) return false; // show button
    return true; // hide button
  }

  get toHideImg(): boolean {
    if (this.imgToRemove || this.imageFailedToLoad) return true; // hide image
    if (this.noteService.theNoteHasImage && this.inputEl && this.inputEl.nativeElement.files.length > 0) return true; // hide image
    if (!this.noteService.theNoteHasImage) return true; // hide image
    return false; // show image
    // if (!this.contentInit) return true;
    //  const hideIt = this.imgToRemove || this.imageFailedToLoad || !this.note || !this.note.imageURL || (this.inputEl && this.inputEl.nativeElement.files.length > 0 && this.note.imageURL);
    //  return hideIt as boolean;
  }

  private changed() { // compare form value with original note in edit case
    if (this.noteService.todo === Todo.Add) return true; // add
    const orig = this.note;
    const form = this.noteForm.value;
    const changed = form.name !== orig.name || form.text !== orig.text || this._fileChanged || this.imageFailedToLoad;
    return changed;
  }

  private saveNote(toRemoveExistingImage?: boolean) { // assumes this.note has form value
    let inputEl: HTMLInputElement = this.inputEl.nativeElement;

    this.noteService.save(this.note, inputEl.files, this.imageFailedToLoad, toRemoveExistingImage)
      .then(data => {
        console.log('saved', data);
      })
      .catch((error) => console.log('saveNote error', error));

    this.goBack();;
  }

  popup;
  body;
  html;

  loadImage() {
    console.warn('imageURL', this.toHideButton, this.toHideImg);
    //this.contentInit = true;

    this.popup = document.querySelector('#popup');
    console.log(this.body);
    
    /*this.body*/window.addEventListener('scroll', scroll, false);

    if (this.note && this.note.imageURL) {
      console.log('imageURL', this.note.imageURL);
      const img = <HTMLImageElement>document.querySelector("#myimg");
      img.addEventListener('load', _ => console.log('image loaded'));
      img.addEventListener('error', error => {
        console.warn('image failed to load', error);
        this.imageFailedToLoad = true;
      });
      img.src = this.note.imageURL;
    }
  }

  private init(showing: boolean = true) {
    this.body = document.querySelector('body');
    this.html = document.querySelector('html');

    if (showing) {
      //var input = document.querySelector('.ddm input[type="checkbox"][id]');

      console.log('addEventListener');
      //document.addEventListener('scroll', handlerScroll, true);

      this.body.classList.add('noScroll');
      this.html.classList.add('noScroll');
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
      console.log('removeEventListener');
      //document.removeEventListener('scroll', handlerScroll, true);
      this.body.classList.remove('noScroll');
      this.html.classList.remove('noScroll');
      window.removeEventListener('scroll', scroll, false);
      this.note = null;
      this.imgToRemove = false;
      this.imageFailedToLoad = false;
      this._fileChanged = false;
    }
  }

  /**
   * This component initializes with hidden DOM
   */
  show(event: any, group: any) {

    this.calculateZoomOrigin(event);
    this.makeVisible();
    this.init();

    /*
    this._selectedGroup = '_newGroup';
    if (group) {
      const all = this.groups.getAll();
      this._selectedGroup = all[all.indexOf(group)].title;
    }*/
  }
  /**
   * Calculate origin used in the `zoomFadeInFrom()`
   */
  private calculateZoomOrigin(event) {
    const clientX = event.clientX;
    const clientY = event.clientY;

    const window = document.body.getBoundingClientRect();
    const wh = window.width / 2;
    const hh = window.height / 2;
    const x = clientX - wh;
    const y = clientY - hh;
    const ox = clientX / window.width;
    const oy = clientY / window.height;

    this.data.params.x = `${x}px`;
    this.data.params.y = `${y}px`;
    this.data.params.ox = `${ox * 100}%`;
    this.data.params.oy = `${oy * 100}%`;
  }

  private makeVisible() {
    this.data.value = 'active';
  }

  hide() {
    this.init(false);

    this.data.value = 'inactive';
    console.log('hide()');
  }

  toggle() {
    this.data.value === 'active' ? this.hide() : this.makeVisible();
  }


}