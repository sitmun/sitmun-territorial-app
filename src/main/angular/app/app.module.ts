import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

//Hybrid app imports
import { UpgradeModule, setAngularJSGlobal } from '@angular/upgrade/static';
import { setUpLocationSync } from '@angular/router/upgrade';

import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { ExternalConfigurationService } from './ExternalConfigurationService';
import { AngularHalModule } from 'angular-hal';

import { HomeComponent } from './home/home.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {FlexLayoutModule} from '@angular/flex-layout';
import {SitmunPluginCoreModule,LoginComponent,AccountEditComponent,AccountChangePasswordComponent,
        MapConfigurationManagerService, 
        Layer, LayerConfiguration, LayerGroup} from 'sitmun-plugin-core';

//Angular js imports
import {topicServiceProvider} from './ajs-upgraded-providers';

import * as angular from 'angular';

//Tree imports
import {TreeComponentFacade} from '../tree/tree.component';
import {treeModule} from '../tree/tree.module';

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
    HomeComponent,
    /*,
    
    TerritoryListComponent,
    
    TerritoryEditComponent,
    TerritoryTypeListComponent,
    TerritoryTypeEditComponent,
    RoleListComponent,
    RoleEditComponent,
    RoleListComponent,
    RoleEditComponent,
    UserListComponent,
    UserEditComponent,
    UserPositionListComponent,
    UserPositionEditDialog,
    UserPositionEditComponent,
    UserConfigurationEditComponent,
    UserConfigurationEditDialog,
    UserConfigurationListComponent
    */
  ],
  imports: [
    BrowserModule, 
    FlexLayoutModule,
    SitmunPluginCoreModule.forRoot(),  
    MatSidenavModule,
    
    
    /*,

    MatToolbarModule,  
    MatButtonModule,
    MatIconModule,
    HttpClientModule,
    
    MatCardModule,
    MatInputModule,
    MatListModule,
    
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatTabsModule,
    MatTableModule,
    FormsModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    
    NoopAnimationsModule,
    MatDialogModule,
    */
    //Upgrade module import for angularjs modules
    UpgradeModule,
    AngularHalModule.forRoot(),
    RouterModule.forRoot(appRoutes)
  ],
  entryComponents: [
  /*
    UserPositionEditDialog,
    UserConfigurationEditDialog
    */
   AppComponent
  ],
 providers: [
    {provide: 'ExternalConfigurationService', useClass: ExternalConfigurationService},
    /*,
   TerritoryService,
   TerritoryTypeService,
   UserService
   */
   //ResourceService,
   //ExternalService,
   //Map and tree module services
   MapConfigurationManagerService,
   topicServiceProvider
 ]/*,
  bootstrap: [AppComponent]*/
})

//Upgrade configuration to be able to use and communicate with angularjs modules
export class AppModule { 
  constructor(private upgrade: UpgradeModule, private router:RouterModule ) { }
  ngDoBootstrap() {
    //
    this.upgrade.bootstrap(document.body, 
      [treeModule.name]);
    //Notify the url changes to the Router
    setUpLocationSync(this.upgrade);
  }

}
