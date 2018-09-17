import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgInputFileComponent } from './ng-input-file.component';

describe('NgInputFileComponent', () => {
  let component: NgInputFileComponent;
  let fixture: ComponentFixture<NgInputFileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgInputFileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgInputFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
