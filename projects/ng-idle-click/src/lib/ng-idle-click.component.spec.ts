import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgIdleClickComponent } from './ng-idle-click.component';

describe('NgIdleClickComponent', () => {
  let component: NgIdleClickComponent;
  let fixture: ComponentFixture<NgIdleClickComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgIdleClickComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgIdleClickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
