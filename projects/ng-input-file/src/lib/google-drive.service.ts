import { Injectable, OnDestroy, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

export interface GoogleApiConfig {
  developerKey: string;
  appId: string;
  clientId: string;
}

const GOOGLE_API_URL = "https://apis.google.com/js/api.js?onload=loadPicker";
const SCOPE = ['https://www.googleapis.com/auth/drive'];
declare var google;

@Injectable()
export class GoogleDriveService implements OnDestroy {
  isDevMode = isDevMode();
  
  config: GoogleApiConfig;

  private file$ = new Subject<File>();
  selectedFile = this.file$.asObservable();

  pickerApiLoaded = false;
  oauthToken;

  googleApiUrl = GOOGLE_API_URL;
  googleApiLoaded = false;

  constructor(private http: HttpClient) {
    if (this.isDevMode) console.warn(`'google-drive.service'`);

    this.onAuthApiLoad = this.onAuthApiLoad.bind(this);
    this.onPickerApiLoad = this.onPickerApiLoad.bind(this);
    this.handleAuthResult = this.handleAuthResult.bind(this);
    this.pickerCallback = this.pickerCallback.bind(this);
  }
  
  ngOnDestroy() {
  }

  init(config: GoogleApiConfig) {
    this.config = config;
  }

  loadScript(): Promise<any> {
    if (!this.config) return;

    return new Promise((resolve, reject) => {
      if (this.googleApiLoaded) {
        resolve('already loaded');
        return;
      }
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = this.googleApiUrl;
      script.onload = () => {
        this.googleApiLoaded = true;
        resolve('loaded');
      }
      script.onerror = (error => resolve('failed to load'));
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  }

  loadPicker() {
    if (!this.config) return;

    this.pickerApiLoaded = false;
    this.oauthToken = null;
    this.doLoadPicker();
  }

  private doLoadPicker() {
    gapi.load('auth', {'callback': this.onAuthApiLoad});
    gapi.load('picker', {'callback': this.onPickerApiLoad});
  }
  private onAuthApiLoad() {
    gapi.auth.authorize(
        {
          'client_id': this.config.clientId,
          'scope': SCOPE,
          'immediate': false
        },
        this.handleAuthResult);
  }
  
  private onPickerApiLoad() {
    this.pickerApiLoaded = true;
    this.createPicker();
  }

  private handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
      this.oauthToken = authResult.access_token;
      this.createPicker();
      if (this.isDevMode) console.log('handleAuthResult', authResult);
    }
  }
  
  private createPicker() {
    if (this.pickerApiLoaded && this.oauthToken) {
      var origin = window.location.protocol + '//' + window.location.host;
      if (this.isDevMode) console.log(`createPicker origin '${origin}'`);
  
      var view = new google.picker.View(google.picker.ViewId.DOCS);
      view.setMimeTypes("image/png,image/jpeg,image/jpg");
      var picker = new google.picker.PickerBuilder()
          .enableFeature(google.picker.Feature.NAV_HIDDEN)
          .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
          .setAppId(this.config.appId)
          .setOAuthToken(this.oauthToken)
          .setOrigin(origin)
          .addView(view)
          .addView(new google.picker.DocsUploadView())
          // .setDeveloperKey(developerKey)
          .setCallback(this.pickerCallback)
          .build();
       picker.setVisible(true);
    }
  }

  private async pickerCallback(data) {
    if (data.action == google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const accessToken = gapi.auth.getToken().access_token;
      if (this.isDevMode) console.log('The user selected', fileId, accessToken, doc);

      let file: File;
      await this.getFile(fileId, accessToken).pipe(take(1))
        .forEach((blob) => {
          file = new File([blob], doc.name, { type: blob.type });
          this.file$.next(file);
      });
    }
  }

  private getFile(fileId, accessToken): Observable<Blob> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    return this.http.get(url, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${accessToken}`
      }),
      responseType: 'blob'
    });
  }
}