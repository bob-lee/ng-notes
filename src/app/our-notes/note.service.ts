import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { FirebaseApp } from 'angularfire2';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { Subject } from 'rxjs/Subject';
import * as firebase from 'firebase/app';

import { Note, Todo, LoginWith } from './Note';
import { WindowRef } from '../service/window-ref.service';

@Injectable()
export class NoteService implements CanActivate {
  user: Observable<firebase.User>;
  userName: string;
  notes: FirebaseListObservable<Note[]>;
  groups: FirebaseListObservable<any[]>; // 29Jul17

  private announceGroupName = new Subject<string>();
  announcedGroupName = this.announceGroupName.asObservable();

  private _groupName: string;
  get groupName(): string { return this._groupName; }
  set groupName(name: string) {
    this._groupName = name;
    this.announceGroupName.next(name);
  }

  private _countNotes: number = 0;
  get countNotes(): number { return this._countNotes; }
  set countNotes(count: number) { this._countNotes = count; }

  countGroups: number = 0;

  private storage: firebase.storage.Reference;
  private dbRef: firebase.database.Reference;

  private _todo: Todo = Todo.List;
  get todo(): Todo { return this._todo; }
  set todo(todo: Todo) { this._todo = todo; }

  private _note: Note; // note to edit, to be set by note component when clicked for edit
  get note(): Note { return this._note; }
  set note(note: Note) { this._note = note; }

  get loggedIn(): boolean { return this.afAuth.auth.currentUser ? true : false; }

  constructor(app: FirebaseApp,
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private router: Router,
    private windowRef: WindowRef) {
    console.warn(`'note.service'`); // watch when / how often the service is instantiated

    this.user = afAuth.authState;
    afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        console.log('logged in', user);
        this.userName = user.displayName || 'Anonymous';
      } else {
        console.log('logged out');
        this.userName = '';
        this.router.navigate(['/login']);
      }
    });

    this.storage = app.storage().ref();
    this.dbRef = this.db.database.ref();

  }

  canActivate(): Observable<boolean> {
    return this.user.map(auth => {
      if (auth) {
        return true;
      } else {
        return false;
      }
    });
  }

  exit(): void {
    this.notes = null; // empty group
    this.countNotes = 0;
    this.groupName = '';
  }

  getGroupNotes(group: string): void {
    console.log(`getGroupNotes(${group})`);
    if (!this.groupName) this.groupName = group; // 01Aug17 set group name
    this.notes = this.db.list(`notes`, {
      query: {
        orderByChild: 'group',
        equalTo: group
      }
    });
    this.notes.subscribe(
      notes => {
        this.countNotes = notes.length;
        console.log('countNotes', this.countNotes);
      }
    );
  }

  getNotePromise(id: string, group: string): Promise<Note> {
    console.log(`getNotePromise(${id}, ${group})`);
    return new Promise((resolve, reject) => {
      if (this.note) {
        resolve(this.note);
      } else { // page refresh
        this.getGroupNotes(group);

        // to query object by key from database, use AngularFireDatabase.object: https://github.com/angular/angularfire2/blob/master/src/database/database.ts
        this.db.object(`notes/${id}`).subscribe(item => {
          console.log('found', item);
          resolve(item);
        });
      }
    });
  }

  initAfterLogin() { // to be called after login by component
    this.groups = this.db.list('groups');
    this.groups.subscribe(
      groups => { this.countGroups = groups.length; console.log('countGroups', this.countGroups); }
    );
  }

  login(loginWith: LoginWith) {
    return loginWith === LoginWith.Facebook ? this.loginFb() :
      loginWith === LoginWith.Google ? this.loginGoogle() :
        this.loginAnonymous();
  }

  loginAnonymous() {
    return this.afAuth.auth.signInAnonymously();
  }

  loginFb() {
    return this.afAuth.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider());
  }

  loginGoogle() {
    return this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  logout() {
    return this.afAuth.auth.signOut();
  }

  save(note: any, files, imageFailedToLoad: boolean, toRemoveExistingImage?: boolean): any/*firebase.database.ThenableReference*/ {
    console.log(`save ${Todo[this._todo]}, imageFailedToLoad=${imageFailedToLoad}, toRemoveExistingImage=${toRemoveExistingImage}`);
    note.updatedAt = firebase.database.ServerValue.TIMESTAMP;
    note.group = this._groupName;
    console.log('note', note);

    if (this._todo === Todo.Add) { // add

      if (files && files.length > 0) {
        const file = files.item(0);
        if (file) {
          console.log('file', file);

          return this.storage.child(`images/${file.name}`).put(file)
            .then((snapshot) => {
              console.log('uploaded file:', snapshot.downloadURL);
              note.imageURL = snapshot.downloadURL;
              //this.testThumb(file.name);
              return this.notes.push(note);
            })
            .catch(error => {
              console.error('failed to upload', error);
            });
        }
      }

      //return this.notes.push(note);
      return this.saveNote(note);

    } else if (this._todo === Todo.Edit) { // edit

      return this.saveEdit(note, files, imageFailedToLoad, toRemoveExistingImage);

    } else if (this._todo === Todo.Remove) { // remove

      if (note.imageURL && !imageFailedToLoad) {
        return this.storage.storage.refFromURL(note.imageURL).delete()
          .then(() => this.notes.remove(note))
          .catch((error) => console.error('failed to delete image', error)); // what if image deleted up there?
      }
      return this.notes.remove(note);
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
  private saveEdit(note: any, files, imageFailedToLoad: boolean, toRemoveExistingImage?: boolean): any/*firebase.database.ThenableReference*/ {

    if (note.imageURL) { // existing image
      const ref = this.storage.storage.refFromURL(note.imageURL);
      console.log('ref to existing image', ref);

      if (!toRemoveExistingImage && (!files || files.length === 0)) {
        console.log('case 2a.');

        if (imageFailedToLoad) {
          note.imageURL = null;
          note.thumbURL = null;
        }

      } else if (toRemoveExistingImage && (!files || files.length === 0)) {
        console.log('case 2b.');

        /*
        if (imageFailedToLoad) {
          note.imageURL = null;
          return this.notes.update(note.$key, note);
        } else {
          return ref.delete()
            .then(() => {
              console.log('deleted existing image');
              note.imageURL = null;
              return this.notes.update(note.$key, note);
            })
            .catch((error) => console.error('failed to delete image', error));
        }
        */

        return ref.delete() // Promise.then.catch.then, pro: DRY, con: one more http call
          .then(() => {
            console.log('deleted existing');
          })
          .catch((error) => {
            console.error('failed to delete image', error);
          })
          .then(() => {
            console.log('finally');
            note.imageURL = null;
            note.thumbURL = null;
            return this.notes.update(note.$key, note);
          });

      } else if (/*toRemoveExistingImage && */files && files.length > 0) {
        console.log('case 2c.');
        const file = files.item(0);

        return ref.delete()
          .then(() => {
            console.log('deleted existing');
          })
          .catch((error) => {
            console.error('failed to delete image', error);
            note.imageURL = null;
            note.thumbURL = null;
          })
          .then(() => {
            console.log('finally');
            if (file) {
              return this.storage.child(`images/${file.name}`).put(file)
                .then((snapshot) => {
                  console.log('uploaded file:', snapshot.downloadURL);
                  note.imageURL = snapshot.downloadURL;
                  return this.notes.update(note.$key, note);
                })
                .catch(error => { // throw away any changes on note
                  console.error('failed to upload', error);
                });
            }
            return this.notes.update(note.$key, note);
          });

      }
    } else { // no existing image

      if (!files || files.length === 0) {
        console.log('case 1a.');
      } else if (files && files.length > 0) {
        console.log('case 1b.');

        const file = files.item(0);
        if (file) {
          console.log('selected file', file);

          return this.storage.child(`images/${file.name}`).put(file)
            .then((snapshot) => {
              console.log('uploaded file:', snapshot.downloadURL);
              note.imageURL = snapshot.downloadURL;
              return this.notes.update(note.$key, note);
            })
            .catch(error => {
              console.error('failed to upload', error);
            });
        }
      }
    }

    return this.notes.update(note.$key, note);
  }

  private saveNote(note: Note): firebase.Promise<any> {
    console.log('saveNote', note);

    var newNoteKey = this.dbRef.child('notes').push().key;
    var updates = {};
    updates[`groups/${note.group}`] = true;
    updates[`notes/${newNoteKey}`] = note;

    return this.dbRef.update(updates);
  }

  search(group: string): FirebaseListObservable<Note[]> { // search by group name
    this.groupName = group;
    this.getGroupNotes(group);

    if (this.windowRef.nativeWindow.localStorage) { // remember group
      this.windowRef.nativeWindow.localStorage.setItem('group', group);
    }

    return this.notes;
  }

}