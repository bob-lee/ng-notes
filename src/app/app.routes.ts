import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { OurNotesComponent } from './our-notes/our-notes.component';
import { NoteComponent } from './note/note.component';
import { NoteFormComponent } from './note-form/note-form.component';
import { NoteService } from './service/note.service';

export const AppRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', 
    component: LoginComponent, 
    data: { animation: { value: 'login' } } 
  },
  { path: 'group', 
    component: OurNotesComponent, 
    canActivate: [NoteService],
    data: { animation: { value: 'group' } } 
  },
  {
    path: 'group/:name', component: OurNotesComponent,
    children: [
      { path: '', redirectTo: 'notes', pathMatch: 'full' },
      { path: 'notes', component: NoteComponent },
      { path: 'add', component: NoteFormComponent }, // 'group/Lee%20family/add'
      { path: 'edit/:id', component: NoteFormComponent }, // 'group/Lee%20family/edit/58d73eb63af56f27e48d693d'
    ]
  }
];
