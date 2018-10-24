import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatInputModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMdModule } from 'ngx-md';

import { OurNotesComponent } from './our-notes.component';
import { GroupsComponent } from './groups/groups.component';
import { GroupComponent } from './group/group.component';
import { ImageComponent } from './group/note/image/image.component';
import { NoteComponent } from './group/note/note.component';
import { NoteModalComponent } from './note-modal/note-modal.component';
import { LoaderComponent } from './loader.component';

import { NoteService } from './note.service';
import { ModalService } from './modal.service';
import { FocusMeDirective } from '../focus-me.directive';
import { AfterIfDirective } from '../after-if.directive';

import { NgIdleClickModule } from 'ng-idle-click';
import { NgInputFileModule } from 'ng-input-file';
import { NgScrolltopModule } from 'ng-scrolltop';
import { LazyLoadModule } from 'ng-lazy-load';
import { NgAnimateValueModule } from 'ng-animate-value';
import { TouchStartModule } from '../touchstart.module';

import { OurNotesRoutingModule } from './our-notes-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    NgxMdModule.forRoot(),
    OurNotesRoutingModule,
    TouchStartModule,
    NgIdleClickModule,
    NgInputFileModule,
    NgScrolltopModule,
    NgAnimateValueModule,
    LazyLoadModule,
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
    LoaderComponent,
  ],
  providers: [
    NoteService,
    ModalService,
  ]
})
export class OurNotesModule {}
