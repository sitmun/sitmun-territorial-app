import {Directive, ElementRef, Injector, Input} from '@angular/core';
import {UpgradeComponent} from '@angular/upgrade/static';

// treeComponent angularjs typescript definition
export const treeComponent = {
  selector: 'treeModule',
  templateUrl: './tree.component.html',
  stylesUrls: ['./tree.component.css'],
  bindings: {
  },
  controller: class TreeComponent {
    treeConfiguration: any;
    backgroundsConfiguration: any;
    situationMapConfiguration: any;
    applicationConfiguration: any;
    extent: any;
    languageConfiguration:string;
    defaultAttribution:string;
  }
};

// TreeComponent angular module wrapper (upgrades the angularjs directive)
@Directive({selector: treeComponent.selector})
export class TreeComponentFacade extends UpgradeComponent {
  @Input() treeConfiguration;
  @Input() backgroundsConfiguration;
  @Input() situationMapConfiguration;
  @Input() applicationConfiguration;
  @Input() languageConfiguration;
  @Input() defaultAttribution;
  @Input() extent;
  constructor(elementRef: ElementRef, injector: Injector) {
    super(treeComponent.selector, elementRef, injector);
  }
}
