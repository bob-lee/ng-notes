import { Component, OnInit, ViewChild, VERSION } from '@angular/core';
import { routerTransition } from './app.animation';
import { Router } from '@angular/router';
import { NoteService } from './our-notes/note.service';
import { FooterComponent } from './footer/footer.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [ routerTransition ],
})
export class AppComponent implements OnInit {
  name = `v${VERSION.full}`;
  @ViewChild(FooterComponent)
  private footer: FooterComponent;
  subscription: Subscription;
  inside = false;

  constructor(public router: Router, public noteService: NoteService) { }

  ngOnInit() {
    this.subscription = this.noteService.announcedGroupName.subscribe(
      groupName => {
        this.footer.groupName = groupName;
        setTimeout(_ => {
          this.inside = !!groupName;
        });
      });

  }

  add({ event, done }) { // moved from our-notes.component again to app.component // moved from group.component in favor of animation
    console.log(`add`);
    this.noteService.add(event);
    done();
  }

  getState(outlet) {
    return outlet.activatedRouteData.state;
  }

}
