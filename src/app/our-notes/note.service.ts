import { Injectable, OnDestroy } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import * as firebase from 'firebase/app';
/*
import { firebase } from '@firebase/app';
import { FirebaseApp } from '@firebase/app-types';
import { FirebaseAuth, User } from '@firebase/auth-types';
import { FirebaseDatabase, Reference as DbRef } from '@firebase/database-types';
import { FirebaseMessaging } from '@firebase/messaging-types';
import { FirebaseStorage, Reference as StRef } from '@firebase/storage-types';
import { FirebaseFirestore, DocumentSnapshot, Query } from '@firebase/firestore-types';
*/

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireStorage } from 'angularfire2/storage';

import { combineLatest as observableCombineLatest, Observable, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { first, filter, map, switchMap } from 'rxjs/operators';

import { Note, Todo, LoginWith } from './Note';
import { WindowRef } from '../service/window-ref.service';

export interface FirestoreFunctions {
  addNote: (note: Note) => any;
  removeNote: (note: Note) => any;
  editNote: (note: Note) => any;
}
export const PAGE_SIZE = 3;
export type documentSnapshot = firebase.firestore.DocumentSnapshot;

export const STORAGE_IMAGE_FOLDER = 'images';
export const STORAGE_VIDEO_FOLDER = 'videos';

@Injectable()
export class NoteService implements CanActivate, OnDestroy {
  database = 1; // 1: rtds, 2: firestore

  items$: Observable<any[]>;
  group$: BehaviorSubject<string | null>;
  page$: BehaviorSubject<boolean | null>;
  next$: BehaviorSubject<boolean | null>;

  pagination: boolean | null = null;

  user: Observable<firebase.User>;
  userName: string;
  userPhotoUrl: string;

  private dbRef: firebase.database.Reference;

  groups: Observable<any[]>;
  groupsFs: Observable<any[]>;
  groupsTotal: Observable<any[]>;
  countGroups = 0;
  countGroupsFs = 0;
  countGroupsTotal = 0;

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
  subStateChange: Subscription;

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

  countNotes = 0;
  private listStateInternal = 'none'; // none, added, modified, removed
  listState = 'none';

  todo: Todo = Todo.List;

  note: Note; // note to edit, to be set by note component when clicked for edit

  get loggedin() { return !!this.userName; }

  private groupDoc: AngularFirestoreDocument<any>;
  fsSubscription: Subscription = null;

  // pagination -->
  private page = 1;
  private first$: Observable<documentSnapshot>;
  private last$: Observable<documentSnapshot>;
  private first: documentSnapshot;
  private last: documentSnapshot;
  private firstInPage: documentSnapshot;
  private lastInPage: documentSnapshot;
  get isFirstPage(): boolean { return this.first && this.firstInPage && this.first.id === this.firstInPage.id ? true : false; }
  get isLastPage(): boolean { return this.last && this.lastInPage && this.last.id === this.lastInPage.id ? true : false; }
  // <-- pagination

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private db: AngularFireDatabase,
    private storage: AngularFireStorage,
    private router: Router,
    private windowRef: WindowRef) {
    console.warn(`'note.service'`); // watch when / how often the service is instantiated

    this.user = afAuth.authState;
    afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        console.log('logged in', user);
        this.userName = user.displayName || 'Anonymous';
        this.userPhotoUrl = user.providerData[0].photoURL;

        this.initAfterLogin();
      } else {
        console.log('logged out');
        this.userName = '';
        this.userPhotoUrl = '';
        this.router.navigate(['/login']);
      }
    });

    this.dbRef = this.db.database.ref();

    afs.firestore.settings({ timestampsInSnapshots: true });

    // observables for firestore

    this.group$ = new BehaviorSubject(null);
    this.page$ = new BehaviorSubject(null);
    this.next$ = new BehaviorSubject(null);

    this.items$ = observableCombineLatest(
      this.group$,
      this.page$,
      this.next$
    ).pipe(switchMap(([group, page, next]) => { // called on any changes on [group, page, next]

      if (this.subStateChange) this.subStateChange.unsubscribe(); // should do earlier?

      this.collection = this.getGroupDoc(group).collection('notes', ref => {
        let query: firebase.firestore.Query = ref;
        if (page) { // do paginate
          if (next === null) { // first page
            query = query.orderBy('updatedAt', 'desc').limit(PAGE_SIZE);
          } else if (next) { // next page
            query = query.orderBy('updatedAt', 'desc').startAfter(this.lastInPage).limit(PAGE_SIZE);
          } else { // previous page
            query = query.orderBy('updatedAt').startAfter(this.firstInPage).limit(PAGE_SIZE);
          }
        } else { // query all
          query = query.orderBy('updatedAt', 'desc');
        }
        return query;
      });

      // filter out 'modified' state change due to firestore timestamp being set for newly-added note
      this.stateChanges = this.collection.stateChanges().pipe(
        map(actions => actions.filter(action =>
          (action.type === 'modified' &&
          action.payload.doc.id === this.lastChanged.$key &&
          this.lastChanged.$type === 'added') ? false : true
        )));

      //if (this.subStateChange) this.subStateChange.unsubscribe(); // should do earlier?

      this.subStateChange = this.stateChanges.subscribe(actions => actions.map(action => {
        console.log('stateChange', action.payload);
        this.lastChanged = {
          $key: action.payload.doc.id,
          $type: action.type
        };
        this.listStateInternal = action.type;

        this.announceLastSaved(this.lastChanged.$key, this.lastChanged.$type, action.payload.newIndex);
        setTimeout(_ => this.lastChanged.$type = '', 2000);
      }));

      return this.collection.snapshotChanges().pipe(
        //.filter(actions => actions.length > 0)
        map(actions => { // why hits twice on page change?
          this.countNotes = actions.length;
          console.log('snapshotChanges', this.countNotes);
          if (this.countNotes === 0) {
            this.firstInPage = null;
            this.lastInPage = null;
            return actions;
          }

          const array = this.next$.getValue() === false ? actions.reverse() : actions;
          this.firstInPage = array[0].payload.doc;
          this.lastInPage = array[actions.length - 1].payload.doc;
          console.log('firstInPage', this.firstInPage.id);
          console.log('lastInPage', this.lastInPage.id);

          return array.map(action => {
            //console.log(action.payload.doc.data());
            const { updatedAt, ...rest } = action.payload.doc.data();
            this.listState = this.listStateInternal;
            return {
              $key: action.payload.doc.id,
              $type: action.type,
              updatedAt: updatedAt && updatedAt.toDate(),
              ...rest
            };
          })
        }));
    }));

    this.first$ = this.group$.pipe(switchMap(group =>
      this.getGroupDoc(group).collection('notes', ref =>
        ref.orderBy('updatedAt', 'desc').limit(1))
        .snapshotChanges().pipe(
        filter(actions => actions.length > 0),
        map(actions => {
          console.log('first$', actions.length);
          return actions[0].payload.doc
        }),)
    ));
    this.last$ = this.group$.pipe(switchMap(group =>
      this.getGroupDoc(group).collection('notes', ref =>
        ref.orderBy('updatedAt', 'asc').limit(1))
        .snapshotChanges().pipe(
        filter(actions => actions.length > 0),
        map(actions => {
          console.log('last$', actions.length);
          return actions[0].payload.doc
        }),)
    ));

  }

  canActivate(): Observable<boolean> {
    return this.user.pipe(map(auth => !!auth));
  }

  ngOnDestroy() {
    console.warn(`'note.service' ngOnDestroy()`);
    if (this.subscription && !this.subscription.closed) this.subscription.unsubscribe();
  }

  exit(): void {
    // clear group-specific
    this.notes = null;
    this.countNotes = 0;
    this.groupName = '';
    this.groupDoc = null;
    this.page = 1;
    if (this.fsSubscription) {
      this.fsSubscription.unsubscribe();
      this.fsSubscription = null;
    }
    if (this.subStateChange) this.subStateChange.unsubscribe();
    this.next$.next(null);
    this.page$.next(null);
    this.group$.next(null);

    this.pagination = null;
  }


  private getGroupDoc(group: string): AngularFirestoreDocument<any> {
    if (this.groupDoc) {
      return this.groupDoc;
    }
    const groupDoc = this.afs.collection(`notes`).doc(group);
    groupDoc.valueChanges().pipe(first()).subscribe(doc => {
      console.log('doc', doc);
      if (!doc) {
        groupDoc.set({ exist: true }); // create a document for a new group
      }
    });

    this.groupDoc = groupDoc;

    return groupDoc;
  }

  getGroupNotes(group: string, database: any = 1, page?: any): Observable<any[]> { // to be called once entering the group
    this.groupName = group;
    this.database = database;
    const pagination = !!(page && page > 0);
    if (database == 1 || !pagination) this.page = 1;

    console.log(`getGroupNotes(${group}, ${database == 1 ? 'rtdb' : 'firestore'}, ${page})`);

    if (this.database == 1) { // rtdb
      this.listRef = this.db.list<Note>(`notes`, ref =>
        ref.orderByChild('group').equalTo(group));
      return this.notes = this.listRef.snapshotChanges().pipe(
        map(actions => {
          this.countNotes = actions.length;
          return actions.map(action => ({ $key: action.key, ...action.payload.val() }));
        }));
    } else { // firestore
      this.next$.next(null);
      this.page$.next(pagination);
      this.group$.next(group);

      if (!this.fsSubscription) {
        this.fsSubscription = this.first$.subscribe(first => {
          this.first = first;
          console.log('first', first.id);
        });

        this.fsSubscription.add(this.last$.subscribe(last => {
          this.last = last;
          console.log('last', last.id);
        }));

        // this.fsSubscription.add(this.pagination$.subscribe(pagination => {
        //   console.log('pagination$', pagination);
        //   this.getGroupNotesFirestore(pagination);
        // }));
      }

      this.pagination = pagination;

      return this.notes;
    }
  }

  getPageNumber(next: boolean): number {
    if ((next && this.isLastPage) || (!next && this.isFirstPage)) return this.page;

    const newPage = this.page + (next ? 1 : -1);

    return newPage > 0 ? newPage : this.page;
  }

  gotoPage(page: number) {
    console.log(`gotoPage(${this.page}=>${page})`);
    if (page === this.page) return;
    const next = page > this.page;
    this.page += next ? 1 : -1;

    this.next$.next(next);
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
      this.objRef.valueChanges().pipe(first()).subscribe(item => {
        console.log('found', item);
        resolve(item);
      });
    });
  }

  getState(note: any): string {
    if (note.$type === 'added') {
      return 'added';
    } else if (note.$type === 'removed') {
      return 'removed';
    } else if (note.$type === 'modified' && this.lastChanged.$key === note.$key && this.lastChanged.$type === 'modified') {
      return 'modified'; // animate it
    } else {
      return 'void';
    }
  }

  initAfterLogin() {
    this.groups = this.db.list('groups').snapshotChanges().pipe(
      map(actions => {
        this.countGroups = actions.length;
        this.countGroupsTotal = this.countGroups + this.countGroupsFs;
        console.log('countGroups', this.countGroups);
        return actions.map(action => ({ $key: action.key }));
      }));

    this.groupsFs = this.afs.collection('notes').snapshotChanges().pipe(
      map(actions => {
        this.countGroupsFs = actions.length;
        this.countGroupsTotal = this.countGroups + this.countGroupsFs;
        console.log('countGroupsFs', this.countGroupsFs);
        return actions.map(action => ({ $key: action.payload.doc.id }));
      }));
  }

  async login(loginWith: LoginWith) {
    if (loginWith === LoginWith.Facebook) await this.loginFb();
    else if (loginWith === LoginWith.Google) await this.loginGoogle()
    else await this.loginAnonymous();
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

  async removeNote(note): Promise<void> {
    console.log('removeNote', note.$key, this.database);
    if (this.database == 1) {
      await this.listRef.remove(note.$key);
    } else {
      await this.collection.doc(note.$key).delete();
    }
    console.log('removed');
  }

  async save(noteToSave: any, files, imageFailedToLoad: boolean, toRemoveExistingImage?: boolean): Promise<any> {
    console.log(`save ${Todo[this.todo]}, imageFailedToLoad=${imageFailedToLoad}, toRemoveExistingImage=${toRemoveExistingImage}`);

    const note = noteToSave || this.theNote;

    if (this.todo !== Todo.Remove) {
      if (this.database == 1) {
        note.updatedAt = firebase['database'].ServerValue.TIMESTAMP;
      }
    }
    note.group = this._groupName;
    console.log('note', note);

    if (this.todo === Todo.Add) { // add

      if (files && files.length > 0) {
        const file = files.item(0);
        if (file) {
          console.log('file', file);

          await this.putImage(file, note);
        }
      }

      return this.saveNew(note);

    } else if (this.todo === Todo.Edit) { // edit

      return this.saveEdit(note, files, imageFailedToLoad, toRemoveExistingImage);

    } else if (this.todo === Todo.Remove) { // remove

      if (note.imageURL && !imageFailedToLoad && this.database == 1) { // for firestore, let cloud function 'handleImage' do the job
        await this.deleteImage(note.imageURL);
      }

      return this.removeNote(note);
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
  private async saveEdit(note: any, files, imageFailedToLoad: boolean, toRemoveExistingImage?: boolean): Promise<any> {
    this.toSave = { $key: note.$key, $type: 'modified', index: -1 };

    const imageURL = note.imageURL;
    if (imageURL) { // existing image
      console.log(`saveEdit(${imageURL}`);

      if (!toRemoveExistingImage && (!files || files.length === 0)) {
        console.log('case 2a.');

        if (imageFailedToLoad) {
          note.imageURL = null;
          note.thumbURL = null;
        }

      } else if (toRemoveExistingImage && (!files || files.length === 0)) {
        console.log('case 2b.');

        if (this.database == 1) {
          await this.deleteImage(imageURL);
        }

        console.log('finally');
        note.imageURL = null;
        note.thumbURL = null;
      } else if (files && files.length > 0) {
        console.log('case 2c.');
        const file = files.item(0);

        if (this.database == 1 && !await this.deleteImage(imageURL)) {
          note.imageURL = null;
        }
        note.thumbURL = null;

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

  private async deleteImage(downloadURL: string): Promise<boolean> {
    // for signed URL, refFromURL will fail and return false. Works for downloadURL.
    try {
      const ref = this.storage.storage.refFromURL(downloadURL);
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
      const destination = file.type.startsWith('image/') ? STORAGE_IMAGE_FOLDER :
        file.type.startsWith('video/') ? STORAGE_VIDEO_FOLDER : '';
      if (!destination) {
        throw new Error(`invalid file type '${file.type}'`);
      }

      const snapshot = await this.storage.ref(`${destination}/${file.name}`).put(file);
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
      const newNoteKey = this.dbRef.child('notes').push().key;
      const updates = {};
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

  search(group: string, database: any, page?: any): Observable<any[]> { // search by group name
    if (this.windowRef.nativeWindow.localStorage) { // remember group
      this.windowRef.nativeWindow.localStorage.setItem('group', group);
    }

    return this.getGroupNotes(group, database, page);
  }

  setTheNote(note?: any) { // to be called by user of FormModalComponent
    if (note && note.$key) { // edit
      this.theNote = {
        $key: note.$key, // needed?
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
        updatedAt: firebase['firestore'].FieldValue.serverTimestamp(),
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
      const key = note.$key;
      delete note.$key;
      await this.collection.doc(key).update(note);
    }
  }

  resetListState() {
    this.listState = 'none';
  }

}
