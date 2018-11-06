import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material';
import { ReactiveFormsModule } from '@angular/forms';
import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireStorageModule } from 'angularfire2/storage';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { OurNotesModule } from './our-notes/our-notes.module';
import { LoginComponent } from './login/login.component';
import { TouchStartModule } from './touchstart.module';
import { NgScrolltopModule } from 'ng-scrolltop';
import { NgIdleClickModule } from 'ng-idle-click';
import { FooterComponent } from './footer/footer.component';
import { MatIconModule } from '@angular/material/icon';

import { WindowRef } from './service/window-ref.service';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    FooterComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatSnackBarModule,
    MatIconModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule,
    AngularFireStorageModule,
    ReactiveFormsModule,
    OurNotesModule,
    AppRoutingModule,
    TouchStartModule,
    NgScrolltopModule,
    NgIdleClickModule,
  ],
  providers: [
    WindowRef
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
