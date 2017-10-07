import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { FirebaseApp } from 'angularfire2';
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

@Injectable()
export class NoteService implements CanActivate {
  user: Observable<firebase.User>;
  userName: string;
  notes: Observable<Note[]>;
  groups: Observable<any[]>;
  objRef: AngularFireObject<Note>;
  listRef: AngularFireList<Note>;
  subscription: Subscription = null;

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
    if (!this.groupName) this.groupName = group;
    if (this.subscription && !this.subscription.closed) this.subscription.unsubscribe();

    this.listRef = this.db.list<Note>(`notes`, ref =>
      ref.orderByChild('group').equalTo(group));

    this.notes = this.listRef.snapshotChanges()
      .map(action => {
        //console.log('action', action.length);
        const arr = [];
        action.forEach(e => {
          const $key = e.key;
          arr.push({ $key, ...e.payload.val() });
        });
        return arr;
      });

    this.subscription = this.notes.subscribe(notes => {
      this.countNotes = notes.length;
      console.log('countNotes', this.countNotes/*, notes*/);
    });

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

  initAfterLogin() { // called by OurNotesComponent when logged in
    this.groups = this.db.list('groups').snapshotChanges()
      .map(action => {
        //console.log('action', action.length);
        const arr = [];
        action.forEach(e => {
          const $key = e.key;
          arr.push({ $key });
        });
        return arr;
      });
    this.subscription = this.groups.subscribe(groups => {
      this.countGroups = groups.length;
      console.log('countGroups', this.countGroups);
    });
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
    if (this.subscription && !this.subscription.closed) this.subscription.unsubscribe();

    return this.afAuth.auth.signOut();
  }

  save(note: any, files, imageFailedToLoad: boolean, toRemoveExistingImage?: boolean): any/*firebase.database.ThenableReference*/ {
    console.log(`save ${Todo[this._todo]}, imageFailedToLoad=${imageFailedToLoad}, toRemoveExistingImage=${toRemoveExistingImage}`);
    if (this._todo !== Todo.Remove) note.updatedAt = firebase.database.ServerValue.TIMESTAMP;
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
              return this.listRef.push(note);
            })
            .catch(error => {
              console.error('failed to upload', error);
            });
        }
      }

      return this.saveNote(note);

    } else if (this._todo === Todo.Edit) { // edit

      return this.saveEdit(note, files, imageFailedToLoad, toRemoveExistingImage);

    } else if (this._todo === Todo.Remove) { // remove

      if (note.imageURL && !imageFailedToLoad) {
        return this.storage.storage.refFromURL(note.imageURL).delete()
          .then(() => this.listRef.remove(note.$key))
          .catch((error) => console.error('failed to delete image', error)); // what if image deleted up there?
      }

      return this.listRef.remove(note.$key);
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
    console.log('note', note);

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
            return this.update(note);
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
                  return this.update(note);
                })
                .catch(error => { // throw away any changes on note
                  console.error('failed to upload', error);
                });
            }
            return this.update(note);
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
              return this.update(note);
            })
            .catch(error => {
              console.error('failed to upload', error);
            });
        }
      }
    }

    return this.update(note);
  }

  private saveNote(note: Note): Promise<any> {
    console.log('saveNote', note);

    var newNoteKey = this.dbRef.child('notes').push().key;
    var updates = {};
    updates[`groups/${note.group}`] = true;
    updates[`notes/${newNoteKey}`] = note;

    return this.dbRef.update(updates);
  }

  search(group: string): Observable<Note[]> { // search by group name
    this.groupName = group;
    this.getGroupNotes(group);

    if (this.windowRef.nativeWindow.localStorage) { // remember group
      this.windowRef.nativeWindow.localStorage.setItem('group', group);
    }

    return this.notes;
  }

  private update(note) {
    if (!this.objRef) return;

    return this.objRef.update(note).then(_ => {
      this.objRef = null;
    });
  }

}