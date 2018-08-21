import { TestBed, inject } from '@angular/core/testing';

import { NgIdleClickService } from './ng-idle-click.service';

describe('NgIdleClickService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NgIdleClickService]
    });
  });

  it('should be created', inject([NgIdleClickService], (service: NgIdleClickService) => {
    expect(service).toBeTruthy();
  }));
});
