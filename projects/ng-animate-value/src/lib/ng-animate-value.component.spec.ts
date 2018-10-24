import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgAnimateValueComponent } from './ng-animate-value.component';

describe('NgAnimateValueComponent', () => {
  let component: NgAnimateValueComponent;
  let fixture: ComponentFixture<NgAnimateValueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgAnimateValueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgAnimateValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
