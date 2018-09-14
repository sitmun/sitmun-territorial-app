import { Component, OnInit } from '@angular/core';
import { ResourceHelper } from 'angular-hal';
import { JsonPipe } from '@angular/common';

import {Application,ApplicationService,Tree,TreeService,CartographyGroup,CartographyGroupService,ApplicationParameterService,ApplicationBackgroundService,ApplicationParameter,ApplicationBackground,Background,Cartography,Service} from 'sitmun-plugin-core';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  public isHome = true;
  application: Application;
  id = 5;     	
  constructor(private treeService: TreeService,
    private applicationService: ApplicationService,
    private cartographyGroupService: CartographyGroupService,
    private applicationParameterService: ApplicationParameterService,
    private applicationBackgroundService: ApplicationBackgroundService) {
      }

  ngOnInit() {
      
       if (this.id) {
        this.applicationService.get(this.id).subscribe((application: any) => {
          if (application) {
            this.application = application;
            this.application.createdDate = new Date();
            this.application.createdDate.setTime(Date.parse(application.createdDate));
            
            
            this.application.getRelation(CartographyGroup, 'situationMap').subscribe(
                    (situationMap: CartographyGroup) => 
                    {
                        this.application.situationMap = situationMap;
                        //TODO  resolveCartographyGroup(this.application.situationMap);
                        
                    },
                    error => this.application.situationMap = new CartographyGroup());
            
            this.application.getRelationArray(Tree, 'trees').subscribe(
                    (trees: Tree[]) => {
                      
                    this.application.trees = trees;
                     //TODO for
                        // TODO  resolveTree(this.application.trees[i]);
                    

                 },
                    error => this.application.trees= new Array<Tree>());
              this.application.getRelationArray(ApplicationParameter, 'parameters').subscribe(
                    (applicationParameters: ApplicationParameter[]) => {
                      
                    this.application.parameters = applicationParameters;
                    

                 },
                    error => this.application.parameters= new Array<ApplicationParameter>());
              this.application.getRelationArray(ApplicationBackground, 'backgrounds').subscribe(
                    (applicationBackgrounds: ApplicationBackground[]) => {
                      
                    this.application.backgrounds = applicationBackgrounds;
                        //TODO for
                        // TODO  resolveApplicationBackground(this.application.trees[i]);
                    

                 },
                    error => this.application.backgrounds= new Array<ApplicationBackground>());
              
              delete this.application._links;            
          } else {
            console.log(`application with id '${this.id}' not found, returning to list`);
            
          }
        });
      }
      
  }

}
