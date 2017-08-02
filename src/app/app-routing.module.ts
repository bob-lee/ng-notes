import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { GroupsComponent } from './groups/groups.component';
import { OurNotesComponent } from './our-notes/our-notes.component';
import { NoteComponent } from './note/note.component';
import { NoteFormComponent } from './note-form/note-form.component';

import { NoteService } from './service/note.service';

const appRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', 
    component: LoginComponent, 
    data: { state: 'login' } 
  },
  { path: 'group', 
    component: OurNotesComponent, 
    canActivate: [NoteService],
    data: { state: 'group' },
    children: [
      { path: '', component: GroupsComponent }, // 'group'
      { path: ':name', component: NoteComponent }, // 'group/Lee%20family'
      { path: ':name/add', component: NoteFormComponent }, // 'group/Lee%20family/add'
      { path: ':name/edit/:id', component: NoteFormComponent }, // 'group/Lee%20family/edit/58d73eb63af56f27e48d693d'
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
