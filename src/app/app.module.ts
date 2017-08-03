import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'web-animations-js';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AngularFireModule } from 'angularfire2';
import 'firebase/storage'; // only import firebase storage, https://github.com/angular/angularfire2/issues/946
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { OurNotesModule } from './our-notes/our-notes.module';
import { LoginComponent } from './login/login.component';

import { WindowRef } from './service/window-ref.service';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebase, 'ng-notes'),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    ReactiveFormsModule,
    HttpModule,
    OurNotesModule,
    AppRoutingModule,
  ],
  providers: [
    WindowRef
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
