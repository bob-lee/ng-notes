import { Injectable } from '@angular/core';

@Injectable()
export class ModalService {
  private modal: any;

  constructor() { }

  getModal() {
    return this.modal;
  }
  
  setModal(m) {
    this.modal = m;
  }
}
