import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OurNotesComponent } from './our-notes.component';
import { GroupsComponent } from './groups/groups.component';
import { GroupComponent } from './group/group.component';

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
