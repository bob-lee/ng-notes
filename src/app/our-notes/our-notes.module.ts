import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MdButtonModule, MdCheckboxModule, MdRadioModule, MdInputModule } from '@angular/material';
import 'hammerjs';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { MarkdownModule } from 'angular2-markdown';

import { OurNotesComponent } from './our-notes.component';
import { GroupsComponent } from './groups/groups.component';
import { GroupComponent } from './group/group.component';
import { NoteFormComponent } from './note-form/note-form.component';
import { NoteModalComponent } from './note-modal/note-modal.component';

import { NoteService } from './note.service';
import { ModalService } from './modal.service';
import { FocusMeDirective } from '../focus-me.directive';
import { AfterIfDirective } from '../after-if.directive';
import { TouchStartModule } from '../touchstart.module';

import { OurNotesRoutingModule } from './our-notes-routing.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MdButtonModule, MdCheckboxModule, MdRadioModule, MdInputModule,
    BsDropdownModule.forRoot(),
    MarkdownModule.forRoot(),
    OurNotesRoutingModule,
    TouchStartModule,
  ],
  declarations: [
    OurNotesComponent,
    GroupsComponent,
    GroupComponent,
    NoteFormComponent,
    NoteModalComponent,
    FocusMeDirective,
    AfterIfDirective,
  ],
  providers: [ 
    NoteService,
    ModalService,
  ]
})
export class OurNotesModule {}