import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgScrolltopComponent } from './ng-scrolltop.component';

describe('NgScrolltopComponent', () => {
  let component: NgScrolltopComponent;
  let fixture: ComponentFixture<NgScrolltopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgScrolltopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgScrolltopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
