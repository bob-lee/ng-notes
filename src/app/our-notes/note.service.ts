import { Injectable, OnDestroy, EmbeddedViewRef, TemplateRef } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import * as firebase from 'firebase/app';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireStorage } from 'angularfire2/storage';

import { combineLatest as observableCombineLatest, Observable, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

import { Note, Todo, LoginWith } from './Note';
import { WindowRef } from '../service/window-ref.service';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar  } from '@angular/material';
import { IntersectionState } from 'ng-lazy-load';

export interface FirestoreFunctions {
  addNote: (note: Note) => any;
  removeNote: (note: Note) => any;
  editNote: (note: Note) => any;
}

export const STORAGE_IMAGE_FOLDER = 'images';
export const STORAGE_VIDEO_FOLDER = 'videos';

@Injectable()
export class NoteService implements CanActivate, OnDestroy {
  items$: Observable<any[]>;
  group$: BehaviorSubject<string | null>;

  user: Observable<firebase.User>;
  userName: string;
  userPhotoUrl: string;
  isOwner = false;

  groupsFs: Observable<any[]>;
  countGroupsFs = 0;

  private order$ = new Subject<any>();
  announcedOrder = this.order$.asObservable();

  // firestore
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

  note: Note; // note to edit, to be set by note component when clicked for edit // to go

  get loggedin() { return !!this.userName; }
  get inside() { return !!this.groupName; }

  private groupDoc: AngularFirestoreDocument<any>;
  fsSubscription: Subscription = null;
  private doAnimation = false;

  debug = false;

  countRegistered = 0;
  countListening = 0;
  countIntersecting = 0;
  countNearIntersecting = 0;
  countVisible = 0;
  countPrerender = 0;

  updateCount(state: IntersectionState) {
    switch (state) {
      case IntersectionState.Registered:
        this.countRegistered++;
        break;
      case IntersectionState.Listening:
        this.countListening++;
        break;
      case IntersectionState.Intersecting:
        this.countIntersecting++;
        break;
      case IntersectionState.NearIntersecting:
        this.countNearIntersecting++;
        break;
      case IntersectionState.Visible:
        this.countVisible++;
        break;
      case IntersectionState.Prerender:
        this.countPrerender++;
        break;
      default:
        this.countRegistered = 0;
        this.countListening = 0;
        this.countIntersecting = 0;
        this.countNearIntersecting = 0;
        this.countVisible = 0;
        this.countPrerender = 0;
        break;
    }
  }

  clear() {
    this.userName = '';
    this.userPhotoUrl = '';
    this.isOwner = false;
  }

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private router: Router,
    public snackBar: MatSnackBar,
    private windowRef: WindowRef) {
    console.warn(`'note.service'`); // watch when / how often the service is instantiated

    this.user = afAuth.authState;
    afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        console.log('logged in', user);
        this.userName = user.displayName || 'Anonymous';
        this.userPhotoUrl = user.providerData[0].photoURL;
        this.isOwner = !user.isAnonymous && user.email === 'bob.bumsuk.lee@gmail.com';

        this.initAfterLogin();
      } else {
        this.clear();
        this.router.navigate(['/login']);
        console.log('logged out');
      }
    });

    afs.firestore.settings({ timestampsInSnapshots: true });

    // observables for firestore

    this.group$ = new BehaviorSubject(null);

    this.items$ = observableCombineLatest(
      this.group$,
    ).pipe(switchMap(([group]) => { // called on any changes on [group, ]

      console.log(`item$(${group})`);

      if (this.subStateChange) this.subStateChange.unsubscribe(); // should do earlier?

      this.collection = this.getGroupDoc(group).collection('notes', ref => {
        let query: firebase.firestore.Query = ref;
        query = query.orderBy('updatedAt', 'desc');
        return query;
      });

      // filter out 'modified' state change due to firestore timestamp being set for newly-added note
      this.stateChanges = this.collection.stateChanges().pipe(
        map(actions => actions.filter(action =>
          !this.doAnimation ||
          (action.type === 'modified' &&
            action.payload.doc.id === this.lastChanged.$key &&
            this.lastChanged.$type === 'added') ? false : true
        )));

      this.subStateChange = this.stateChanges.subscribe(actions => actions.map(action => {
        // console.log('stateChange', action.payload);
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
            return actions;
          }

          const array = /*this.next$.getValue() === false ? actions.reverse() :*/ actions;

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
  }

  canActivate(): Observable<boolean> {
    return this.user.pipe(map(auth => !!auth));
  }

  ngOnDestroy() {
    console.warn(`'note.service' ngOnDestroy()`);
    if (this.subscription && !this.subscription.closed) this.subscription.unsubscribe();
  }

  add(event) {
    this.order$.next({ event, order: 'add' });
  }

  exit(): void {
    // clear group-specific
    this.doAnimation = false;
    this.countNotes = 0;
    this.groupName = '';
    this.groupDoc = null;
    if (this.fsSubscription) {
      this.fsSubscription.unsubscribe();
      this.fsSubscription = null;
    }
    if (this.subStateChange) this.subStateChange.unsubscribe();
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

  getGroupNotes(group: string): void { // to be called once entering the group
    console.log(`getGroupNotes(${group})`);
    this.groupName = group;
    this.group$.next(group);
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

  initAfterLogin() {
    this.groupsFs = this.afs.collection('notes').snapshotChanges().pipe(
      map(actions => {
        this.countGroupsFs = actions.length;
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
    console.log('removeNote', note.$key);
    await this.collection.doc(note.$key).delete();
    console.log('removed');
  }

  async save(noteToSave: any, files, imageFailedToLoad: boolean, toRemoveExistingImage?: boolean): Promise<any> {
    console.log(`save ${Todo[this.todo]}, imageFailedToLoad=${imageFailedToLoad}, toRemoveExistingImage=${toRemoveExistingImage}`);

    const note = noteToSave || this.theNote;

    note.group = this._groupName;
    // console.log('note', note);
    this.doAnimation = true;

    if (this.todo === Todo.Add) { // add

      if (files && files.length > 0) {
        const file = files[0];
        if (file) {
          console.log('file', file);

          await this.putImage(file, note);
        }
      }

      return this.saveNew(note);

    } else if (this.todo === Todo.Edit) { // edit

      return this.saveEdit(note, files, imageFailedToLoad, toRemoveExistingImage);

    } else if (this.todo === Todo.Remove) { // remove

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

        console.log('finally');
        note.imageURL = null;
        note.thumbURL = null;
      } else if (files && files.length > 0) {
        console.log('case 2c.');
        const file = files[0];

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

        const file = files[0];
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

      const orientation = await this.getOrientation(file);
      console.log(`putImage(orientation ${orientation})`);

      const snapshot = await this.storage.ref(`${destination}/${file.name}`).put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();
      console.log('uploaded file:', downloadURL);
      note.imageURL = downloadURL;
      note.orientation = orientation;
      return true;
    } catch (error) {
      console.error('failed to upload', error);
      return false;
    }
  }

  private getOrientation(file: any): Promise<number> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = function (e) {
        console.log(`reader`, e);
        const view = new DataView(reader.result as ArrayBuffer);
        if (view.getUint16(0, false) != 0xFFD8) {
          resolve(-2);
        }
        let length = view.byteLength, offset = 2;
        while (offset < length) {
          const marker = view.getUint16(offset, false);
          offset += 2;
          if (marker == 0xFFE1) {
            if (view.getUint32(offset += 2, false) != 0x45786966) {
              resolve(-1);
            }
            const little = view.getUint16(offset += 6, false) == 0x4949;
            offset += view.getUint32(offset + 4, little);
            var tags = view.getUint16(offset, little);
            offset += 2;
            for (let i = 0; i < tags; i++)
              if (view.getUint16(offset + (i * 12), little) == 0x0112) {
                const o = view.getUint16(offset + (i * 12) + 8, little);
                resolve(o);
              }
          } else if ((marker & 0xFF00) != 0xFF00) {
            break;
          } else {
            offset += view.getUint16(offset, false);
          }
        }

        resolve(-1);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  private async saveNew(note: Note): Promise<any> {
    console.log('saveNew');

    this.toSave = { $key: '', $type: 'added', index: -1 };
    const ref = await this.collection.add(note);
    if (this.toSave.$key === ref.id) {
      this.lastSaved$.next({ $key: ref.id, $type: 'added', index: this.toSave.index });
    }
    return ref;
  }

  search(group: string): void { // search by group name
    if (this.windowRef.nativeWindow.localStorage) { // remember group
      this.windowRef.nativeWindow.localStorage.setItem('group', group);
    }

    this.getGroupNotes(group);
  }

  setTheNote(note?: any) { // to be called by user of FormModalComponent
    if (note && note.$key) { // edit
      this.theNote = {
        $key: note.$key, // needed?
        group: note.group,
        name: note.name,
        text: note.text,
        updatedAt: note.updatedAt,
        imageURL: note.imageURL || '',
        orientation: note.orientation || 1
      };
      this.todo = Todo.Edit;
    } else { // add
      this.theNote = {
        group: this.groupName,
        name: this.userName || '',
        text: '',
        updatedAt: firebase['firestore'].FieldValue.serverTimestamp(),
        imageURL: '',
        orientation: 1
      };
      this.todo = Todo.Add;
    }
  }

  private async update(note): Promise<void> {
    const key = note.$key;
    delete note.$key;
    await this.collection.doc(key).update(note);
  }

  public openSnackBar(message: string, action: string, duration = 3000): MatSnackBarRef<SimpleSnackBar> {
    return this.snackBar.open(message, action, {
      duration: duration,
    });
  }
  public openSnackBarTemplate(template: TemplateRef<any>, duration = 3000): MatSnackBarRef<EmbeddedViewRef<any>> {
    return this.snackBar.openFromTemplate(template, {
      duration: duration,
    });
  }

  public get userNameInitials() { // https://stackoverflow.com/a/33076482/588521
    const name = this.userName;
    // const name = ''; // ''
    // const name = 'A'; // A
    // const name = 'a b'; // AB
    // const name = 'a b c'; // AC
    let initials = name.match(/\b\w/g) || [];
    return ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
  }

  resetListState() {
    this.listState = 'none';
  }

}
