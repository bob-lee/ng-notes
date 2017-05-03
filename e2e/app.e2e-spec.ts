import { NgNotesPage } from './app.po';

describe('ng-notes App', () => {
  let page: NgNotesPage;

  beforeEach(() => {
    page = new NgNotesPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
