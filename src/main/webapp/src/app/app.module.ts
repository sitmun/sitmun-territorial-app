import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { ExternalConfigurationService } from './ExternalConfigurationService';
import { AngularHalModule } from 'angular-hal';
import { HomeComponent } from './home/home.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {FlexLayoutModule} from '@angular/flex-layout';
import { SitmunPluginCoreModule,TerritoryListComponent, TerritoryEditComponent, TerritoryTypeListComponent, TerritoryTypeEditComponent, RoleListComponent, RoleEditComponent, UserListComponent, UserEditComponent} from 'sitmun-plugin-core';
    
const appRoutes: Routes = [
  {
    path: '',
    component: HomeComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent/*,
    
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
    SitmunPluginCoreModule,  
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
    AngularHalModule.forRoot(),
    RouterModule.forRoot(appRoutes)
  ],
  entryComponents: [
  /*
    UserPositionEditDialog,
    UserConfigurationEditDialog
    */
  ],
 providers: [
    {provide: 'ExternalConfigurationService', useClass: ExternalConfigurationService}
    /*,
   TerritoryService,
   TerritoryTypeService,
   UserService
   */
   //ResourceService,
   //ExternalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
