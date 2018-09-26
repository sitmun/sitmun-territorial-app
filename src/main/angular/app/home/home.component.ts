import { Component, OnInit } from '@angular/core';
import { Observable} from 'rxjs';
import { ResourceHelper, Resource } from 'angular-hal';
import { JsonPipe } from '@angular/common';
import {TranslateService, LangChangeEvent} from '@ngx-translate/core';

import {Application,ApplicationService,Tree,TreeService,
        CartographyGroup,CartographyGroupService,ApplicationParameterService,
        ApplicationBackgroundService,ApplicationParameter,ApplicationBackground,
        Background,Cartography,Service,Role,Connection, TreeNode, ServiceParameter} from 'sitmun-plugin-core';
        
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  static selector = 'app-home'
  public isHome = true;
  application: Application;
  id = 5;

  //Default attribution
  defaultAttribution:string = "© Institut Cartogràfíc i Geològic de Catalunya";
  
  //Store the app language configuration changes and notify the angularjs module with a directive attribute
  languageConfiguration:string;     	
  
  constructor(private treeService: TreeService,
    private applicationService: ApplicationService,
    private cartographyGroupService: CartographyGroupService,
    private applicationParameterService: ApplicationParameterService,
    private applicationBackgroundService: ApplicationBackgroundService,
    private translationService: TranslateService) {
      if (this.translationService) {
        this.languageConfiguration = this.translationService.currentLang?
                                this.translationService.currentLang:
                                this.translationService.getDefaultLang();
      }
  }

  //Retrieve the element's database unique id from the api rest link request stored as a class property
  private getElementId(element:Resource) {
    var id = "";
    if (element && element._links && element._links.self && element._links.self.href) {
      id = element._links.self.href;
      id = id.substring(id.lastIndexOf("/")+1);
    }
    return id;
  }

  //Parse the ServiceParameter object to obtain its linked objects information
  resolveServiceParameters(service:Service, onComplete?) {
    if (service) {
      var this_= this;
      service.getRelationArray(ServiceParameter, 'parameters').subscribe(
        (parameters: ServiceParameter[]) => {
          service.parameters = parameters;
        }, error => {
          service.parameters = null;
          console.log(`Could not retrieve parameters information information for service '${this_.getElementId(service)}'`);              
        },
        () => {
          if (onComplete && (typeof onComplete  == 'function')) {
            onComplete();
          }
        }
      );
    } else {
      onComplete();
    }
  }

  //Parse the Service object to obtain its linked objects information
  resolveServiceRelations(elements: Cartography[], index:number, onComplete?) {
    if (elements) {
      if (index < elements.length) {
        var member = elements[index];
        var this_ = this;
        //Retrieve information for members
        member.getRelation(Service, 'service').finally(
          function() {
            //Retrieve service params information first
            this_.resolveServiceParameters(member.service, 
              function(){
                this_.resolveServiceRelations(elements, index+1, onComplete)
              });
          }
        ).subscribe(
          (service:Service) => {
            member.service = service;
          },
          error => {
            member.service = null;
            console.log(`Could not retrieve Service information for member '${this_.getElementId(member)}'`);          
          },
          () => {
            //onComplete
          });
      } else {
        //Done
        if (onComplete && (typeof onComplete == 'function')) {
          onComplete();
        }
      }
    } else {
      if (onComplete && (typeof onComplete == 'function')) {
        onComplete();
      }
    }
  }

  //Parse the CartographyGroup object to obtain its linked objects information
  resolveCartographyGroup(cartographyGroup: CartographyGroup, onComplete?) {
    var group:CartographyGroup = cartographyGroup;

    if (group) {
      var groupId = this.getElementId(group);

      var this_ = this;
      group.getRelationArray(Cartography, 'members').finally(
            function() {
              //triggered whether finished gracefully or not
              this_.resolveServiceRelations(group.members, 0, onComplete);
            }
          ).subscribe(
              (members: Cartography[]) => {
                group.members = members;
              },
              error => {
                group.members = new Array<Cartography>()
                console.log(`Could not retrieve Cartography information for cartographyGroup with id '${groupId}'`);          
              },
            () => {
              //onComplete
            });
    } else {
      if (onComplete && (typeof onComplete == 'function')) {
        onComplete();
      }
    }
  }

  //Parse the TreeNode Cartography object to obtain its linked objects information
  resolveTreeNodeCartography(treeNode:TreeNode, onComplete?) {
    if (treeNode) {
      var this_ = this;
      treeNode.getRelation(Cartography, 'cartography').finally(
        function() {
            //triggered whether finished gracefully or not
          if (treeNode.cartography) {
            this_.resolveServiceRelations([treeNode.cartography], 0, onComplete);
          } else {
            if (onComplete && (typeof onComplete == 'function')) {
              onComplete();
            }
          }
        }
      ).subscribe(
        (cartography:Cartography) => {
          treeNode.cartography = cartography;
        }, 
        error => {
          treeNode.cartography = null;
          console.log(`Could not retrieve TreeNode cartography information for tree node with id '${this_.getElementId(treeNode)}'`);          
        },
        () => {
          //onComplete
        }
      );
    } else {
      if (onComplete && (typeof onComplete == 'function')) {
        onComplete();
      }
    }
  }

  //Parse the TreeNode object to obtain its linked objects information
  resolveTreeNode(treeNode:TreeNode, onComplete?) {
    if (treeNode) {
      var this_ = this;
      //Resolve cartography then node parent
      this.resolveTreeNodeCartography(treeNode, function() {
        treeNode.getRelation(TreeNode, 'parent').finally(
          function() {
            //triggered whether finished gracefully or not
            this_.resolveTreeNode(treeNode.parent, onComplete);
          }).subscribe(
          (parent:TreeNode) => {
            treeNode.parent = parent;
          },
          error => {
            treeNode.parent = null;
            console.log(`Could not retrieve TreeNode parent information for tree node with id '${this_.getElementId(treeNode)}'`);          
          },
          () => {
            //onComplete
          }
        );
      })
    } else {
      if (onComplete && (typeof onComplete == 'function')) {
        onComplete();
      }
    }
  }
  
  //Parse the TreeNode Array to obtain its linked objects information
  resolveTreeNodes(treeNodes: TreeNode[], index, onComplete?, componentReference?) {
    if (treeNodes) {
      if (index < treeNodes.length) {
        var this_ = componentReference || this;
        this_.resolveTreeNode(treeNodes[index], function() {
          this_.resolveTreeNodes(treeNodes, index+1, onComplete, componentReference);
        });
      } else {
        if (onComplete && (typeof onComplete == 'function')) {
          onComplete();
        }
      }
    } else {
      if (onComplete && (typeof onComplete == 'function')) {
        onComplete();
      }
    }
  }

  //Parse the Tree Array to obtain its linked objects information
  resolveTrees(trees: Tree[], index, onComplete?) {
    if (trees) {
      if (index < trees.length) {
        var this_ = this;
        var tree = trees[index];
        tree.getRelationArray(TreeNode, 'nodes').finally(
          function() {
            //triggered whether finished gracefully or not
            this_.resolveTreeNodes(tree.nodes, 0, 
              function() {
                this_.resolveTrees(trees, index+1, onComplete);
              }, this_);
        }).subscribe(
          (nodes:TreeNode[]) => {
            tree.nodes = nodes;
          },
          error => {
            tree.nodes = null;
            console.log(`Could not retrieve TreeNode nodes information for tree with id '${this_.getElementId(tree)}'`);          
          },
          () => {
            //onComplete
          }
        );
      } else {
        if (onComplete && (typeof onComplete == 'function')) {
          onComplete();
        }
      }
    } else {
      if (onComplete && (typeof onComplete == 'function')) {
        onComplete();
      }
    }
  }

  //Parse the Background Cartography object to obtain its linked objects information
  resolveBackgroundCartographyGroup(background:Background, onComplete?) {
    if (background) {
      var this_ = this;
      background.getRelation(CartographyGroup, "cartographyGroup").finally(
        function() {
          //triggered whether finished gracefully or not
          this_.resolveCartographyGroup(background.cartographyGroup, onComplete);
      }).subscribe(
        (cartographyGroup:CartographyGroup) => {
          background.cartographyGroup = cartographyGroup;
        },
        error => {
          background.cartographyGroup = null;
          console.log(`Could not retrieve CartographyGroup information for Background with id '${this_.getElementId(background)}'`);          
        },
        () => {
          //onComplete
        }
      );
    } else {
      if (onComplete && (typeof onComplete == 'function')) {
        onComplete();
      }
    }
  } 

  //Parse the ApplicationBackground  array to obtain its linked objects information
  resolveApplicationBackgrounds(backgrounds: ApplicationBackground[], index:number, onComplete?) {
    if (backgrounds) {
      if (index < backgrounds.length) {
        var applicationBackground = backgrounds[index];
        var this_ = this;
        applicationBackground.getRelation(Background, "background").finally(
          function() {
            //triggered whether finished gracefully or not
            this_.resolveBackgroundCartographyGroup(applicationBackground.background, 
              function() {
                this_.resolveApplicationBackgrounds(backgrounds, index+1, onComplete);
              });
        }).subscribe(
          (background:Background)=>{
            applicationBackground.background = background;
          },
          error => {
            applicationBackground.background = null;
            console.log(`Could not retrieve Bacground information for ApplicationBackground with id '${this_.getElementId(applicationBackground)}'`);          
          },
          () => {
            //On complete
          }
        );
      } else {
        if (onComplete && (typeof onComplete == 'function')) {
          onComplete();
        }
      }
    } else {
      if (onComplete && (typeof onComplete == 'function')) {
        onComplete();
      }
    }
  }

  //Stores the current tree situation map configuration and sends it to the angularjs tree module as a directive attribute
  treeSituationMapConfiguration:CartographyGroup = null;
  updateSituationMapConfiguration() {
    this.treeSituationMapConfiguration = this.application?this.application.situationMap:null;
  }

  //Stores the current tree configuration and sends it to the angularjs tree module as a directive attribute
  treeTreesConfiguration:Tree[] = null;
  updateTreesConfiguration() {
    this.treeTreesConfiguration = this.application?this.application.trees:null;
  }

  //Stores the backgrounds configuration and sends it to the angularjs tree module as a directive attribute
  treeBackgroundsConfiguration:ApplicationBackground[] = null;
  updateApplicationBackgroundsConfiguration() {
    this.treeBackgroundsConfiguration = this.application?this.application.backgrounds:null;
  }

  ngOnInit() {

      //Detect the app language selection and notify the angularjs tree module
      this.translationService.onLangChange.subscribe((params: LangChangeEvent) => {
        if (!this.languageConfiguration || (params.lang && (this.languageConfiguration != params.lang))) {
          this.languageConfiguration = params.lang;
        }
      });      
       if (this.id) {
        this.applicationService.get(this.id).subscribe((application: any) => {
          if (application) {
            this.application = application;
            this.application.createdDate = new Date();
            this.application.createdDate.setTime(Date.parse(application.createdDate));

            //Store the object reference to access it in the onComplete anonymous functions
            var this_ = this;
            this.application.getRelation(CartographyGroup, 'situationMap').subscribe(
                    (situationMap: CartographyGroup) => 
                    {
                        this.application.situationMap = situationMap;
                        this.resolveCartographyGroup(this.application.situationMap,
                        function() {
                          //On complete
                          this_.updateSituationMapConfiguration();
                        });
                    },
                    error => this.application.situationMap = new CartographyGroup());
            
            this.application.getRelationArray(Tree, 'trees').subscribe(
                    (trees: Tree[]) => {
                    this.application.trees = trees;
                    this.resolveTrees(this.application.trees, 0,
                      function() {
                        //On complete
                        this_.updateTreesConfiguration();
                      });
                 },
                    error => this.application.trees= new Array<Tree>());
            this.application.getRelationArray(ApplicationParameter, 'parameters').subscribe(
                  (applicationParameters: ApplicationParameter[]) => {
                    
                  this.application.parameters = applicationParameters;
                  //TODO

                },
                  error => this.application.parameters= new Array<ApplicationParameter>());
            this.application.getRelationArray(ApplicationBackground, 'backgrounds').subscribe(
                  (applicationBackgrounds: ApplicationBackground[]) => {
                  this.application.backgrounds = applicationBackgrounds;
                  this.resolveApplicationBackgrounds(this.application.backgrounds, 0, 
                    function() {
                      //On complete
                      this_.updateApplicationBackgroundsConfiguration();
                    });
                },
                  error => this.application.backgrounds= new Array<ApplicationBackground>());
              
              delete this.application._links;            
          } else {
            console.log(`application with id '${this.id}' not found, returning to list`);
            //TODO behaviour on information not found
            this.loadDefaultConfiguration();
          }
        },
        (error:any) => {
          //Behaviour on fail or user not logged
         this.loadDefaultConfiguration();
        });
      }
      
  }

  //TODO FIXME receive the default configuration from the ap
  //Sets whether the map should load the default base layer configuration
  loadMapComponentDefaults:boolean = true;
  //Public values (to be loaded if the user is not logged in)
  loadDefaultConfiguration() {
    this.loadMapComponentDefaults = true;
    //this.treeSituationMapConfiguration = null;
    var defaultTree = new Tree();
    defaultTree.name = "Transporte";
    defaultTree._links = {
      "self": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/trees/354"
      },
      "tree": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/trees/354"
      },
      "nodes": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/trees/354/nodes"
      }
    };
    var node = new TreeNode();
    node.name = "Transporte";
    node.tooltip = "Transporte";
    node.ordee = 1;
    node.active = true;
    node._links = {
          "self": {
            "href": "http://ginebra.internal.geoslab.com:8088/api/tree-nodes/355"
          },
          "treeNode": {
            "href": "http://ginebra.internal.geoslab.com:8088/api/tree-nodes/355"
          },
          "cartography": {
            "href": "http://ginebra.internal.geoslab.com:8088/api/tree-nodes/355/cartography"
          },
          "parent": {
            "href": "http://ginebra.internal.geoslab.com:8088/api/tree-nodes/355/parent"
          },
          "tree": {
            "href": "http://ginebra.internal.geoslab.com:8088/api/tree-nodes/355/tree"
          }
        };
    var cartography = new Cartography();
    cartography.name = "Transporte";
    cartography.type = null;
    cartography.visible = true;
    cartography.transparency = 0;
    cartography.queryable = null;
    cartography.queryAct = null;
    cartography.queryLay = null;
    cartography.createdDate = "2018-09-24T16:01:03.000+0000";
    cartography.order = null;
    cartography.minimumScale = null;
    cartography.maximumScale = null;
    cartography.layers = "TN.RailTransportNetwork.RailwayLink";
    cartography.selectable = null;
    cartography.selectionLayer = null;
    cartography.legendTip = null;
    cartography.legendUrl = null;
    cartography.editable = null;
    cartography.metadataUrl = null;
    cartography.themeable = false;
    cartography.geometryType = null;
    cartography._links = {
            "self": {
              "href": "http://ginebra.internal.geoslab.com:8088/api/cartographies/207"
            },
            "cartography": {
              "href": "http://ginebra.internal.geoslab.com:8088/api/cartographies/207"
            },
            "availabilities": {
              "href": "http://ginebra.internal.geoslab.com:8088/api/cartographies/207/availabilities"
            },
            "selectionService": {
              "href": "http://ginebra.internal.geoslab.com:8088/api/cartographies/207/selectionService"
            },
            "service": {
              "href": "http://ginebra.internal.geoslab.com:8088/api/cartographies/207/service"
            },
            "connection": {
              "href": "http://ginebra.internal.geoslab.com:8088/api/cartographies/207/connection"
            }
          }; 
    var service = new Service();
    service.name = "Service IDEE Transportes";
    service.url = "http://servicios.idee.es/wms-inspire/transportes";
    service.projections = "EPSG:25830,EPSG:4326";
    service.legend = "http://servicios.idee.es/wms-inspire/transportes";
    service.type = "WMS";
    service.infoUrl = "http://servicios.idee.es/wms-inspire/transportes";
    service.createdDate = "2018-09-19T07:30:14.000+0000";
    service._links = {
        "self": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/services/204"
        },
        "service": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/services/204"
        },
        "layers": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/services/204/layers"
        },
        "parameters": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/services/204/parameters"
        },
        "connection": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/services/204/connection"
        }
      };
      
    var parameters = [];
    var parameter = new ServiceParameter();
    parameter.name = "version";
    parameter.value = "1.3.0";
    parameter.type = "WMS";
    parameter._links = {
        "self": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/209"
        },
        "serviceParameter": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/209"
        },
        "service": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/209/service"
        }
      };
    parameters.push(parameter);
    
    parameter = new ServiceParameter();
    parameter.name = "format";
    parameter.value = "png";
    parameter.type = "WMS";
    parameter._links = {
      "self": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/232"
      },
      "serviceParameter": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/232"
      },
      "service": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/232/service"
      }
    };
    parameters.push(parameter);

    service.parameters = parameters;
    cartography.service = service;
    node.cartography = cartography;
    node.parent = null;
    defaultTree.nodes = [node];
    this.treeTreesConfiguration = [defaultTree];
    //this.treeBackgroundsConfiguration = null;
  }

}
