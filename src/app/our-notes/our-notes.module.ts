import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatInputModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { MarkdownModule } from 'angular2-markdown';

import { OurNotesComponent } from './our-notes.component';
import { GroupsComponent } from './groups/groups.component';
import { GroupComponent } from './group/group.component';
import { ImageComponent } from './group/note/image/image.component';
import { NoteComponent } from './group/note/note.component';
import { NoteModalComponent } from './note-modal/note-modal.component';

import { NoteService } from './note.service';
import { ModalService } from './modal.service';
import { FocusMeDirective } from '../focus-me.directive';
import { AfterIfDirective } from '../after-if.directive';
import { NgIdleClickModule } from 'ng-idle-click';
import { NgInputFileModule } from 'ng-input-file';
import { NgScrolltopModule } from 'ng-scrolltop';
import { TouchStartModule } from '../touchstart.module';

import { OurNotesRoutingModule } from './our-notes-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MarkdownModule.forRoot(),
    OurNotesRoutingModule,
    TouchStartModule,
    NgIdleClickModule,
    NgInputFileModule,
    NgScrolltopModule,
  ],
  declarations: [
    OurNotesComponent,
    GroupsComponent,
    GroupComponent,
    NoteModalComponent,
    FocusMeDirective,
    AfterIfDirective,
    NoteComponent,
    ImageComponent,
  ],
  providers: [
    NoteService,
    ModalService,
  ]
})
export class OurNotesModule {}
