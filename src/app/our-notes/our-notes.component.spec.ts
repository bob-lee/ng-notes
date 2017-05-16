import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OurNotesComponent } from './our-notes.component';

describe('OurNotesComponent', () => {
  let component: OurNotesComponent;
  let fixture: ComponentFixture<OurNotesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OurNotesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OurNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
