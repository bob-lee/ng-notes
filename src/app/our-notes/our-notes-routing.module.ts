import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OurNotesComponent } from './our-notes.component';
import { GroupsComponent } from './groups/groups.component';
import { GroupComponent } from './group/group.component';
import { NoteFormComponent } from './note-form/note-form.component';

import { NoteService } from './note.service';

const ourNotesRoutes: Routes = [
  {
    path: 'group',
    component: OurNotesComponent,
    canActivate: [NoteService],
    data: { state: 'home' },
    children: [
      { path: '', component: GroupsComponent, data: { state: 'groups' } }, // 'group'
      { path: ':name', component: GroupComponent, data: { state: 'group' } }, // 'group/Lee%20family'
      { path: ':name/:page', component: GroupComponent, data: { state: 'group' } }, // 'group/Lee%20family/1' for firestore
      { path: ':name/rtdb/add', component: NoteFormComponent, data: { state: 'note' } }, // 'group/Lee%20family/add'
      { path: ':name/rtdb/edit/:id', component: NoteFormComponent, data: { state: 'note' } }, // 'group/Lee%20family/edit/58d73eb63af56f27e48d693d'
      { path: '**', component: GroupsComponent } // wilcard route
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(ourNotesRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class OurNotesRoutingModule { }