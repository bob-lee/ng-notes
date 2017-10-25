import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { NoteService } from '../our-notes/note.service';
import { LoginWith } from '../our-notes/Note';

@Component({
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

  async login(loginWith: LoginWith) {
    try {
      await this.noteService.login(loginWith);
      console.log(`login with ${LoginWith[loginWith]} success`);
      this.router.navigate(['group']);
    } catch (err) {
      console.log(`login with ${LoginWith[loginWith]} fail ${err}`);
      this.error = err;
    }
  }

}
