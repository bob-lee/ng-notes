import { Injectable } from '@angular/core';
import { FirebaseApp } from 'angularfire2';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';

import { Note, Todo } from '../Note';
import { WindowRef } from './window-ref.service';

@Injectable()
export class NoteService {
  user: Observable<firebase.User>;
  notes: FirebaseListObservable<Note[]>;
  groupName: string;

  private storage: firebase.storage.Reference;

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
    private windowRef: WindowRef) {
    console.log('\'note.service\'');

    this.user = afAuth.authState;
    afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        console.log('logged in', user);
      } else {
        console.log('logged out');
      }
    });

    this.storage = app.storage().ref();
  }

  getNote(id: string): any {
    if (this.note) {
      return this.note;
    } else { // page refresh
      console.log('getNote on refresh', this.note);
      this.db.list(`notes/${this.groupName}/${id}`).subscribe(item => {
        console.log('query single item from list', item);
      });
      return null; // make this work // use getNotePromise()
    }
  }

  getNotePromise(id: string): Promise<Note> {
    console.log(`getNotePromise(${id})`);
    return new Promise((resolve, reject) => {
      if (this.note) {
        resolve(this.note);
      } else { // page refresh
        // to query object by key from database, use AngularFireDatabase.object: https://github.com/angular/angularfire2/blob/master/src/database/database.ts
        this.db.object(`notes/${this.groupName}/${id}`).subscribe(item => {
          console.log('query single item from list', item);
          //this._note = item;
          //this.note = item;
          resolve(item);
        });
      }
    });
  }

  login() {
    return this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    // .then(() => console.log('logged in', this.user, this.afAuth.auth.currentUser));
  }

  logInOrOut() {
    return this.loggedIn ? this.logout() : this.login();
  }

  logout() {
    return this.afAuth.auth.signOut();
  }

  save(note: any, files, imageFailedToLoad: boolean, toRemoveExistingImage?: boolean): any/*firebase.database.ThenableReference*/ {
    console.log(`save ${Todo[this._todo]}, imageFailedToLoad=${imageFailedToLoad}, toRemoveExistingImage=${toRemoveExistingImage}`);
    console.log('note', note);
    note.updatedAt = firebase.database.ServerValue.TIMESTAMP;

    if (this._todo === Todo.Add) { // add

      if (files && files.length > 0) {
        const file = files.item(0);
        if (file) {
          console.log('file', file);

          return this.storage.child(`images/${file.name}`).put(file)
            .then((snapshot) => {
              console.log('uploaded file:', snapshot.downloadURL);
              note.imageURL = snapshot.downloadURL;
              return this.notes.push(note);
            })
            .catch(error => {
              console.error('failed to upload', error);
            });
        }
      }

      return this.notes.push(note);

    } else if (this._todo === Todo.Edit) { // edit

      return this.saveEdit(note, files, imageFailedToLoad, toRemoveExistingImage);

    } else if (this._todo === Todo.Remove) { // remove

      if (note.imageURL && !imageFailedToLoad) {
        return this.storage.storage.refFromURL(note.imageURL).delete()
          .then(() => this.notes.remove(note))
          .catch((error) => console.error('failed to delete image', error));
      }
      return this.notes.remove(note);
    }
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
            return this.notes.update(note.$key, note);
          });

      } else if (/*toRemoveExistingImage && */files && files.length > 0) {
        console.log('case 2c.');
        const file = files.item(0);

        /*
        if (imageFailedToLoad) {
          this.note.imageURL = null;
          return this.notes.update(note.$key, note);
        } else {
          return ref.delete()
            .then(() => {
              if (file) {
                console.log('deleted existing, new file to add', file);

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
              return this.notes.update(note.$key, note);
            })
            .catch((error) => console.error('failed to delete image', error));
        }
        */

        return ref.delete()
          .then(() => {
            console.log('deleted existing');
          })
          .catch((error) => {
            console.error('failed to delete image', error);
            note.imageURL = null;
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

  search(term: string) { // search group by name
    if (term) { // enter group
      this.groupName = term;
      this.notes = this.db.list(`notes/${term}`);

      if (this.windowRef.nativeWindow.localStorage) { // remember group
        this.windowRef.nativeWindow.localStorage.setItem('group', term);
      }

      return this.notes;
    } else { // exit group
      this.notes = null; // empty group
      this.groupName = '';
    }
  }
}