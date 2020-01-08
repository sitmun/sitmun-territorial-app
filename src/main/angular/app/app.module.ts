import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

//Hybrid app imports
import { UpgradeModule, setAngularJSGlobal, downgradeComponent } from '@angular/upgrade/static';
import { setUpLocationSync } from '@angular/router/upgrade';

import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { ExternalConfigurationService } from './ExternalConfigurationService';
import { AngularHalModule } from 'angular-hal';

import { HomeComponent } from './home/home.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {FlexLayoutModule} from '@angular/flex-layout';
import {SitmunPluginCoreModule,LoginComponent,AccountEditComponent,AccountChangePasswordComponent} from 'sitmun-plugin-core';

import * as angular from 'angular';

//Tree imports
import {TreeComponentFacade,topicServiceProvider, TREE_MODULE_NAME, GEOADMIN_MODULE_NAME,
  treeComponent} from 'sitmun-plugin-demo';
import {SitmunFrontendCoreModule, MapConfigurationManagerService,
  Layer, LayerConfiguration, LayerGroup} from 'sitmun-frontend-core';

//AppComponent Downgrade
var treeModule = angular.
module(TREE_MODULE_NAME, [GEOADMIN_MODULE_NAME]).
component(treeComponent.selector, treeComponent).
directive(AppComponent.ngSelector, downgradeComponent({
  component: AppComponent,
}));

//Set angularjs version
setAngularJSGlobal(angular);
    
const appRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  }, {
    path: 'account',
    component: AccountEditComponent
  }, {
    path: 'change-password',
    component: AccountChangePasswordComponent
  }, { 
    path: '',
    component: HomeComponent 
  }, { 
    path: '**', 
    redirectTo: '', 
    pathMatch: 'full' 
  }
];

@NgModule({
  declarations: [
    AppComponent,
    TreeComponentFacade,
    TreeComponentFacade,
    HomeComponent
  ],
  imports: [
    BrowserModule, 
    FlexLayoutModule,
    SitmunFrontendCoreModule.forRoot(),
    SitmunPluginCoreModule,
    MatSidenavModule,
    //Upgrade module import for angularjs modules
    UpgradeModule,
    AngularHalModule.forRoot(),
    RouterModule.forRoot(appRoutes)
  ],
  entryComponents: [
   AppComponent
  ],
 providers: [
    {provide: 'ExternalConfigurationService', useClass: ExternalConfigurationService},
   //Map and tree module services
   MapConfigurationManagerService,
   topicServiceProvider
 ]
})

//Upgrade configuration to be able to use and communicate with angularjs modules
export class AppModule { 
  constructor(private upgrade: UpgradeModule, private router:RouterModule ) { }
  ngDoBootstrap() {
    this.upgrade.bootstrap(document.body, 
      [treeModule.name]);
    //Notify the url changes to the Router
    setUpLocationSync(this.upgrade);
  }

}
