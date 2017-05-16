import { Component, OnInit, Input, Output, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { Note, Todo } from '../Note';
import { NoteService } from '../service/note.service';
import { WindowRef } from '../service/window-ref.service';

@Component({
  selector: 'note-form',
  templateUrl: './note-form.component.html',
  styleUrls: ['./note-form.component.css']
})
export class NoteFormComponent implements OnInit {
  @ViewChild('fileInput') inputEl: ElementRef;
  note: Note;
  todoEnum = Todo;
  noteForm: FormGroup;
  submitted: boolean;
  imgToRemove: boolean;
  _fileChanged: boolean; // selected or removed
  /* 
  note that it does not subscribe to value changes of this form.
  on button click, form value is checked and then manually taken to model.
  */

  constructor(private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private noteService: NoteService,
    private windowRef: WindowRef) { }

  ngOnInit() {
    this.noteForm = this.formBuilder.group({
      name: ['', Validators.required],
      text: ['', Validators.required]
    });
    this._fileChanged = false;

    // inspect route
    const addOrEdit = this.route.snapshot.url.length === 1;
    const idToEdit = this.route.snapshot.params['id'];
    console.log('\'NoteFormComponent\'', addOrEdit ? 'adding' : 'editing', idToEdit, this.route.snapshot);

    if (addOrEdit) { // add
      const previousName = this.windowRef.nativeWindow.localStorage.getItem('name');

      this.note = {
        name: previousName ? previousName : '',
        text: '',
        updatedAt: '',
        imageURL: ''
      };
    } else { // edit
      this.note = this.noteService.getNote(idToEdit);
      if (this.note.imageURL) {
        console.log('imageURL', this.note.imageURL);
        (<HTMLImageElement>document.querySelector("#myimg")).src = this.note.imageURL;
      }
    }

    this.noteService.todo = addOrEdit ? Todo.Add : Todo.Edit;

    // apply model to view
    this.noteForm.patchValue(this.note);

    this.submitted = false;
  }

  cancel(e) {
    e.stopPropagation();
    this.noteForm.patchValue(this.note); // restore original
    this.noteService.todo = Todo.List;

    console.log('cancel');
    this.goBack();
  }

  fileSelected() {
    //this.imgToRemove = false;
    this._fileChanged = true;
    console.log(`fileSelected ${this.inputEl.nativeElement.files.length} file(s), imgToRemove=${this.imgToRemove}`);
  }

  remove(e) {
    e.stopPropagation();
    this.noteService.todo = Todo.Remove;
    this.saveNote();
  }

  removeFile(e) {
    this.inputEl.nativeElement.value = ''; // remove any selected file
    this.imgToRemove = true; // hide any downloaded image
    this._fileChanged = true;
    console.log(`removeFile ${this.inputEl.nativeElement.files.length} file(s), imgToRemove=${this.imgToRemove}`);
  }

  save(e) { // add or edit
    e.stopPropagation();
    console.log(`save ${this.noteForm.status} changed=${this.changed()}, ${this.inputEl.nativeElement.files.length} file(s), imgToRemove=${this.imgToRemove}`);
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
  }

  get toHideButton(): boolean {
    const hideIt = this.inputEl.nativeElement.files.length === 0 && !this.note.imageURL/* && this.note.imageURL !== 'remove'*/;
    return hideIt as boolean;
  }

  get toHideImg(): boolean {
    const hideIt = this.imgToRemove || !this.note.imageURL || (this.inputEl.nativeElement.files.length > 0 && this.note.imageURL);
    return hideIt as boolean;
  }

  private changed() { // compare form value and this.note
    if (this.noteService.todo === Todo.Add) return true; // add, changed of course
    const orig = this.note;
    const form = this.noteForm.value;
    const changed = form.name !== orig.name || form.text !== orig.text || this._fileChanged;
    return changed;
  }

  private goBack() {
    this.router.navigate(['group', this.noteService.groupName]);
  }

  private saveNote(editToRemoveExistingImage?: boolean) { // assumes this.note has form value
    let inputEl: HTMLInputElement = this.inputEl.nativeElement;

    this.noteService.save(this.note, inputEl.files, editToRemoveExistingImage)
      .then(() => {
        console.log('saved');
        this.goBack();
      })
      .catch((error) => console.log('saveNote error', error));
  }
}
