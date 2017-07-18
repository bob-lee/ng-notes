import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { NoteService } from '../service/note.service';
import { LoginWith } from '../Note';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  error: any;
  LoginWithEnum = LoginWith;

  constructor(private router: Router,
    public noteService: NoteService) { }

  ngOnInit() {
  }

  login(loginWith: LoginWith) {
    this.noteService.login(loginWith)
    .then(() => {
      console.log(`login with ${LoginWith[loginWith]} success`);
      this.router.navigate(['group']);
    })
    .catch((err) => {
      console.log(`login with ${LoginWith[loginWith]} fail ${err}`);
      this.error = err;
    });
  }

  loginFb() {
    this.noteService.loginFb()
    .then(() => {
      console.log('loginFb success');
      this.router.navigate(['group']);
    })
    .catch((err) => {
      console.log('loginFb fail', err);
      this.error = err;
    });
  }

}
