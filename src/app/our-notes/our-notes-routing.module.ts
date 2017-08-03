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
    data: { state: 'group' },
    children: [
      { path: '', component: GroupsComponent }, // 'group'
      { path: ':name', component: GroupComponent }, // 'group/Lee%20family'
      { path: ':name/add', component: NoteFormComponent }, // 'group/Lee%20family/add'
      { path: ':name/edit/:id', component: NoteFormComponent }, // 'group/Lee%20family/edit/58d73eb63af56f27e48d693d'
      { path: '**', component: GroupsComponent }
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