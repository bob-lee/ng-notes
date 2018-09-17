import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatInputModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { MarkdownModule } from 'angular2-markdown';

import { OurNotesComponent } from './our-notes.component';
import { GroupsComponent } from './groups/groups.component';
import { GroupComponent } from './group/group.component';
import { NoteFormComponent } from './note-form/note-form.component';
import { ImageComponent } from './group/note/image/image.component';
import { NoteModalComponent } from './note-modal/note-modal.component';

import { NoteService } from './note.service';
import { ModalService } from './modal.service';
import { FocusMeDirective } from '../focus-me.directive';
import { AfterIfDirective } from '../after-if.directive';
import { NgIdleClickModule } from 'ng-idle-click';
import { NgInputFileComponent } from 'ng-input-file';
import { TouchStartModule } from '../touchstart.module';

import { OurNotesRoutingModule } from './our-notes-routing.module';
import { NoteComponent } from './group/note/note.component';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    BsDropdownModule.forRoot(),
    MarkdownModule.forRoot(),
    OurNotesRoutingModule,
    TouchStartModule,
    NgIdleClickModule,
  ],
  declarations: [
    OurNotesComponent,
    GroupsComponent,
    GroupComponent,
    NoteFormComponent,
    NoteModalComponent,
    FocusMeDirective,
    AfterIfDirective,
    NoteComponent,
    ImageComponent,
    NgInputFileComponent,
  ],
  providers: [
    NoteService,
    ModalService,
  ]
})
export class OurNotesModule {}
