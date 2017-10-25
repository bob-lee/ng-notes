import { Injectable, OnDestroy } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { FirebaseApp } from 'angularfire2';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/first';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import * as firebase from 'firebase/app';

import { Note, Todo, LoginWith } from './Note';
import { WindowRef } from '../service/window-ref.service';

export interface FirestoreFunctions {
  addNote: (note: Note) => any;
  removeNote: (note: Note) => any;
  editNote: (note: Note) => any;
}

@Injectable()
export class NoteService implements CanActivate, OnDestroy {
  database: number = 1; // 1: rtds, 2: firestore

  user: Observable<firebase.User>;
  userName: string;

  private storage: firebase.storage.Reference;
  private dbRef: firebase.database.Reference;
  private fsRef: firebase.firestore.Firestore;

  groups: Observable<any[]>;
  groupsFs: Observable<any[]>;
  groupsTotal: Observable<any[]>;
  countGroups: number = 0;
  countGroupsFs: number = 0;
  countGroupsTotal: number = 0;

  notes: Observable<any[]>;

  objRef: AngularFireObject<Note>;
  listRef: AngularFireList<Note>;

  // firestore
  private groupRef: AngularFirestoreCollection<any>;
  private collection: AngularFirestoreCollection<any>;
  stateChanges: Observable<any[]>;
  lastChanged = { $key: '', $type: '' };
  toSave = { $key: '', $type: '', index: -1 }; // item to save for add / edit
  theNote: any; // to add or edit
  get theNoteHasImage() { return this.theNote && this.theNote.imageURL; }

  subscription: Subscription = null;

  private groupName$ = new Subject<string>();
  announcedGroupName = this.groupName$.asObservable();

  private lastSaved$ = new Subject<any>();
  announcedLastSaved = this.lastSaved$.asObservable();

  private _groupName: string;
  get groupName(): string { return this._groupName; }
  set groupName(name: string) {
    this._groupName = name;
    this.groupName$.next(name);
  }

  private _countNotes: number = 0;
  get countNotes(): number { return this._countNotes; }
  set countNotes(count: number) { this._countNotes = count; }

  private _todo: Todo = Todo.List;
  get todo(): Todo { return this._todo; }
  set todo(todo: Todo) { this._todo = todo; }

  private _note: Note; // note to edit, to be set by note component when clicked for edit
  get note(): Note { return this._note; }
  set note(note: Note) { this._note = note; }

  get loggedin() { return !!this.userName; }

  constructor(app: FirebaseApp,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private db: AngularFireDatabase,
    private router: Router,
    private windowRef: WindowRef) {
    console.warn(`'note.service'`); // watch when / how often the service is instantiated

    this.user = afAuth.authState;
    afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        console.log('logged in', user);
        this.userName = user.displayName || 'Anonymous';

        this.initAfterLogin();
      } else {
        console.log('logged out');
        this.userName = '';
        this.router.navigate(['/login']);
      }
    });

    this.storage = app.storage().ref();
    this.dbRef = this.db.database.ref();
    this.fsRef = firebase.firestore();
  }

  canActivate(): Observable<boolean> {
    return this.user.map(auth => !!auth);
  }

  ngOnDestroy() {
    console.warn(`'note.service' ngOnDestroy()`);
    if (this.subscription) this.subscription.unsubscribe();
  }

  exit(): void {
    // clear group-specific
    this.notes = null;
    this.countNotes = 0;
    this.groupName = '';
  }

  private getGroupDoc(group: string): AngularFirestoreDocument<any> {
    const groupDoc = this.afs.collection(`notes`).doc(group);
    groupDoc.valueChanges().first().subscribe(doc => {
      console.log('doc', doc);
      if (!doc) {
        groupDoc.set({ exist: true }); // create a document for a new group
      }
    });

    return groupDoc;
  }

  getGroupNotes(group: string): void {
    console.log(`getGroupNotes(${group}, ${this.database == 1 ? 'rtdb' : 'firestore'})`);
    if (!this.groupName) this.groupName = group;
    //if (this.subscription && !this.subscription.closed) this.subscription.unsubscribe();

    if (this.database == 1) { // rtdb
      this.listRef = this.db.list<Note>(`notes`, ref =>
        ref.orderByChild('group').equalTo(group));
      this.notes = this.listRef.snapshotChanges()
        .map(actions => {
          //console.log('action', action.length);
          this.countNotes = actions.length;
          return actions.map(action => ({ $key: action.key, ...action.payload.val() }));
        });
    } else { // firestore
      this.collection = this.getGroupDoc(group).collection(`notes`);

      this.notes = this.collection.snapshotChanges()
        .map(actions => {
          this.countNotes = actions.length;
          return actions.map(action => {
            const $key = action.payload.doc.id;
            const $type = action.type;
            //console.log('snapshotChange', $key, $type);
            return { $key, $type, ...action.payload.doc.data() };
          });
          //return actions.map(action => ({ $key: action.payload.doc.id, $type: action.type, ...action.payload.doc.data() }));
        });

      // firestore stateChanges: emits changes only not a whole array
      const filterFn = action => !(action.type === 'modified' && action.payload.doc.id === this.lastChanged.$key && this.lastChanged.$type === 'added');

      this.stateChanges = this.collection.stateChanges()
        .map(actions => actions.filter(action => filterFn(action)));

      this.stateChanges.subscribe(actions => actions.map(action => {
        //console.log('stateChange', action.payload);
        this.lastChanged = {
          $key: action.payload.doc.id,
          $type: action.type
        };

        this.announceLastSaved(this.lastChanged.$key, this.lastChanged.$type, action.payload.newIndex);
        setTimeout(_ => this.lastChanged.$type = '', 2000);
      }));
    }
  }

  private announceLastSaved($key, $type, index): void {
    if ($type === 'removed' || $type !== this.toSave.$type) return;
    if ($type === 'modified' && $key !== this.toSave.$key) return;

    if ($type === 'added') {
      this.toSave.$key = $key;
      this.toSave.index = index;
    } else {
      this.lastSaved$.next({ $key, $type, index });
      this.toSave.$key = '';
      this.toSave.$type = '';
    }
  }

  getNotePromise(id: string, group: string): Promise<Note> {
    console.log(`getNotePromise(${id}, ${group})`);
    return new Promise((resolve, reject) => {
      this.objRef = this.db.object<Note>(`notes/${id}`);
      this.objRef.valueChanges().first().subscribe(item => {
        console.log('found', item);
        resolve(item);
      });
    });
  }

  getState(note: any): string {
    if (note.$type === 'added') {
      return 'added';
    } else if (note.$type === 'modified' && this.lastChanged.$key === note.$key && this.lastChanged.$type === 'modified') {
      return 'modified'; // animate it
    } else {
      return 'void';
    }
  }

  initAfterLogin() {
    this.groups = this.db.list('groups').snapshotChanges()
      .map(actions => {
        this.countGroups = actions.length;
        this.countGroupsTotal = this.countGroups + this.countGroupsFs;
        console.log('countGroups', this.countGroups);
        return actions.map(action => ({ $key: action.key }));
      });

    this.groupsFs = this.afs.collection('notes').snapshotChanges()
      .map(actions => {
        this.countGroupsFs = actions.length;
        this.countGroupsTotal = this.countGroups + this.countGroupsFs;
        console.log('countGroupsFs', this.countGroupsFs);
        return actions.map(action => ({ $key: action.payload.doc.id }));
      });
  }

  async login(loginWith: LoginWith) {
    if (loginWith === LoginWith.Facebook) await this.loginFb();
    if (loginWith === LoginWith.Google) await this.loginGoogle()
    await this.loginAnonymous();
  }

  async loginAnonymous() {
    await this.afAuth.auth.signInAnonymously();
  }

  async loginFb() {
    await this.afAuth.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider());
  }

  async loginGoogle() {
    await this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  async logout() {
    if (this.subscription && !this.subscription.closed) this.subscription.unsubscribe();

    await this.afAuth.auth.signOut();
  }

  //firestore: public addNote, removeNote, editNote
  async removeNote(note): Promise<void> {
    console.log('removeNote', note.$key, this.database);
    if (this.database == 1) {
      await this.listRef.remove(note.$key);
    } else {
      await this.collection.doc(note.$key).delete();
    }
  }

  async save(noteToSave: any, files, imageFailedToLoad: boolean, toRemoveExistingImage?: boolean): Promise<any> {
    console.log(`save ${Todo[this._todo]}, imageFailedToLoad=${imageFailedToLoad}, toRemoveExistingImage=${toRemoveExistingImage}`);

    const note = noteToSave || this.theNote;

    if (this._todo !== Todo.Remove) {
      if (this.database == 1) {
        note.updatedAt = firebase.database.ServerValue.TIMESTAMP;
      } else {
        //note.updatedAt = firebase.firestore.FieldValue.serverTimestamp(); // updatedAt == createdAt
      }
    }
    note.group = this._groupName;
    console.log('note', note);

    if (this._todo === Todo.Add) { // add

      if (files && files.length > 0) {
        const file = files.item(0);
        if (file) {
          console.log('file', file);

          try {
            const snapshot = await this.storage.child(`images/${file.name}`).put(file);
            console.log('uploaded file:', snapshot.downloadURL);
            note.imageURL = snapshot.downloadURL;
          } catch (error) {
            console.error('failed to upload', error);
          }
        }
      }

      return this.saveNew(note);

    } else if (this._todo === Todo.Edit) { // edit

      return this.saveEdit(note, files, imageFailedToLoad, toRemoveExistingImage);

    } else if (this._todo === Todo.Remove) { // remove

      if (note.imageURL && !imageFailedToLoad) {
        try {
          await this.storage.storage.refFromURL(note.imageURL).delete();
        } catch (error) {
          console.error('failed to delete image', error); // what if image deleted up there?
        }
      }

      return this.removeNote(note);
    }
  }

  thumbURL: string;
  private testThumb(filename: string) {
    setTimeout(_ => {
      this.storage.child(`images/thumb_${filename}`).getDownloadURL()
        .then(url => {
          this.thumbURL = url;
          console.log('thumb URL: ', url);
        });
    }, 10000);
  }

  /* 5 edit cases for image:

      previous      current				action          description
  ----+-------------+-------------+---------------+---------------------------
  1a.	no image      no image			x               null imageURL, no file
  1b.               new image			add             null imageURL, new file
  2a.	image         same          x               imageURL, no file
  2b.               no image			remove          imageURL, toRemove, no file
  2c.               new image			remove and add  imageURL, (toRemove), new file
  ----+-------------+-------------+---------------+---------------------------
  */
  private async saveEdit(note: any, files, imageFailedToLoad: boolean, toRemoveExistingImage?: boolean): Promise<any> {
    this.toSave = { $key: note.$key, $type: 'modified', index: -1 };

    const imageURL = note.imageURL;
    if (imageURL) { // existing image
      const ref = this.storage.storage.refFromURL(imageURL);
      console.log('ref to existing image', ref);

      if (!toRemoveExistingImage && (!files || files.length === 0)) {
        console.log('case 2a.');

        if (imageFailedToLoad) {
          note.imageURL = null;
          note.thumbURL = null;
        }

      } else if (toRemoveExistingImage && (!files || files.length === 0)) {
        console.log('case 2b.');

        await this.deleteImage(ref);

        console.log('finally');
        note.imageURL = null;
        note.thumbURL = null;
      } else if (/*toRemoveExistingImage && */files && files.length > 0) {
        console.log('case 2c.');
        const file = files.item(0);

        if (!await this.deleteImage(ref)) {
          note.imageURL = null;
          note.thumbURL = null;
        }

        console.log('finally');
        if (file) {
          await this.putImage(file, note);
        }
      }
    } else { // no existing image

      if (!files || files.length === 0) {
        console.log('case 1a.');
      } else if (files && files.length > 0) {
        console.log('case 1b.');

        const file = files.item(0);
        if (file) {
          console.log('selected file', file);
          await this.putImage(file, note);
        }
      }
    }

    return this.update(note);
  }

  private async deleteImage(ref: firebase.storage.Reference): Promise<boolean> {
    try {
      await ref.delete();
      console.log('deleted existing');
      return true;
    } catch (error) {
      console.error('failed to delete image', error);
      return false;
    }
  }

  private async putImage(file: any, note: any): Promise<boolean> {
    try {
      const snapshot = await this.storage.child(`images/${file.name}`).put(file);
      console.log('uploaded file:', snapshot.downloadURL);
      note.imageURL = snapshot.downloadURL;
      return true;
    } catch (error) {
      console.error('failed to upload', error);
      return false;
    }
  }

  private async saveNew(note: Note): Promise<any> {
    console.log('saveNew', this.database/*, note*/);

    if (this.database == 1) { // rtdb
      var newNoteKey = this.dbRef.child('notes').push().key;
      var updates = {};
      updates[`groups/${note.group}`] = true;
      updates[`notes/${newNoteKey}`] = note;

      return await this.dbRef.update(updates);
    } else { // firestore
      this.toSave = { $key: '', $type: 'added', index: -1 };
      const ref = await this.collection.add(note);
      if (this.toSave.$key === ref.id) {
        this.lastSaved$.next({ $key: ref.id, $type: 'added', index: this.toSave.index });
      }
      return ref;
    }
  }

  search(group: string, database?: any): Observable<Note[]> { // search by group name
    this.groupName = group;
    if (database) this.database = database;
    this.getGroupNotes(group);

    if (this.windowRef.nativeWindow.localStorage) { // remember group
      this.windowRef.nativeWindow.localStorage.setItem('group', group);
    }

    return this.notes;
  }

  setTheNote(note?: any) { // to be called by user of FormModalComponent
    if (note && note.$key) { // edit
      this.theNote = {
        $key: note.$key,
        group: note.group,
        name: note.name,
        text: note.text,
        updatedAt: note.updatedAt,
        imageURL: note.imageURL || ''
      };
      this.todo = Todo.Edit;
    } else { // add
      this.theNote = {
        group: this.groupName,
        name: '',
        text: '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        imageURL: ''
      };
      this.todo = Todo.Add;
    }
  }

  private async update(note): Promise<void> {
    if (this.database == 1) {
      if (this.objRef) {
        await this.objRef.update(note);
        this.objRef = null;
      }
    } else {
      await this.collection.doc(note.$key).update(note);
    }
  }

}