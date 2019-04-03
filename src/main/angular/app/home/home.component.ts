import { Component, OnInit } from '@angular/core';
import { Observable} from 'rxjs';
import { ResourceHelper, Resource } from 'angular-hal';
import { JsonPipe } from '@angular/common';
import {TranslateService, LangChangeEvent} from '@ngx-translate/core';

import {Application, ApplicationService, Tree, TreeService,
        CartographyGroup, CartographyGroupService, ApplicationParameterService,
        ApplicationBackgroundService, ApplicationParameter, ApplicationBackground,
        Background, Cartography, Service, Role, Connection, TreeNode, ServiceParameter,
        TaskAvailability, TaskAvailabilityService, CartographyAvailability, CartographyAvailabilityService, 
        TaskService, Task, MapConfigurationManagerService, Layer, LayerGroup, MapOptionsConfiguration,
        OptionalParameter, MapComponentStatus, GEOADMIN_TREE_TASK_ID, TERRITORIAL_APP_NAME} from 'sitmun-plugin-core';

export class ApplicationConfiguration {
  type: string;
  theme: string;
  scales: string;
  projections: string;
  treeAutoRefresh: Boolean;
  parameters: ApplicationParameter[];
}
        
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {

  static selector = 'app-home'
  public isHome = true;
  application: Application;
  id = null;

  //Default attribution
  defaultAttribution:string = "© Institut Cartogràfíc i Geològic de Catalunya";
  
  //Store the app language configuration changes and notify the angularjs module with a directive attribute
  languageConfiguration:string;     	
  
  constructor(private treeService: TreeService,
    private applicationService: ApplicationService,
    private cartographyGroupService: CartographyGroupService,
    private applicationParameterService: ApplicationParameterService,
    private applicationBackgroundService: ApplicationBackgroundService,
    private taskService: TaskService,
    private taskAvailabilityService: TaskAvailabilityService,
    private cartographyAvailabilityService: CartographyAvailabilityService,
    private translationService: TranslateService,
    private mapConfigurationManagerService: MapConfigurationManagerService) {
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
      if (Number.isNaN(parseInt(id))) {
        //Not able to retrieve the entity id
        id = "";
      }
    }
    return id;
  }

  //Unique topic id used in tree parsing
  uniqueId:number = 1;
  initializeDefaultValues() {
    this.uniqueId = 1;  
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

        //Check availability against availableCartographies
        var memberId = this.getElementId(member);
        if ((member._links != null) && (member._links != undefined) && 
            (member._links['service'] != null) && (member._links['service'] != undefined)) {
          //The cartography service information is already available
        } else {
          if ((memberId != "") && this.availableCartographies && this.availableCartographies[memberId] && 
              this.availableCartographies[memberId]._links) {
            if (!member._links) {
              member._links = {};
            }
            //Retrieve the cartography service information from the available cartographies map structure
            member._links['service'] = this.availableCartographies[memberId]._links['service'];
          }
        }
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
            console.log(`Could not retrieve Background information for ApplicationBackground with id '${this_.getElementId(applicationBackground)}'`);          
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
  updateSituationMapConfiguration(situationMapConfiguration) {
    if (this.treeComponentEnabled) {
      this.treeSituationMapConfiguration = situationMapConfiguration;
    } else {
      //Send configuration directly to the map
      this.updateMapComponentSituationMap(situationMapConfiguration);
    }
  }

  //Stores the current tree configuration and sends it to the angularjs tree module as a directive attribute
  treeTreesConfiguration:Tree[] = null;
  updateTreesConfiguration(trees) {
    if (this.treeComponentEnabled) {
      this.treeTreesConfiguration = trees;
    } else {
      //Send configuration directly to the map
      this.updateMapComponentLayers(trees);
    }
  }

  //Stores the backgrounds configuration and sends it to the angularjs tree module as a directive attribute
  treeBackgroundsConfiguration:ApplicationBackground[] = null;
  updateApplicationBackgroundsConfiguration(backgrounds) {
    if (this.treeComponentEnabled) {
      this.treeBackgroundsConfiguration = backgrounds;
    } else {
      //Send configuration directly to the map
      this.updateMapComponentBackgrounds(backgrounds);
    }
  }

  applicationConfiguration:ApplicationConfiguration = null;
  updateApplicationConfiguration(options?) {
    var configuration:ApplicationConfiguration = null;
    if (this.application || options) {
      configuration = new ApplicationConfiguration();
    }
    if (options) {
      if (options && options.type) {
        configuration.type = options.type;
      }
      if (options && options.theme) {
        configuration.theme = options.theme;
      }
      if (options && options.scales) {
        configuration.scales = options.scales;
      }
      if (options && options.projections) {
        configuration.projections = options.projections;
      }
      if (options && ((options.treeAutoRefresh != undefined) && (options.treeAutoRefresh != null))) {
        configuration.treeAutoRefresh = options.treeAutoRefresh;
      }
      configuration.parameters = null;
      if (options && options.parameters) {
        configuration.parameters = options.parameters;
      }
    } else if (this.application) {
      if (this.application.type) {
        configuration.type = this.application.type;
      }
      if (this.application.theme) {
        configuration.theme = this.application.theme;
      }
      if (this.application.scales) {
        configuration.scales = this.application.scales;
      }
      if (this.application.projections) {
        configuration.projections = this.application.projections;
      }
      if (this.application.treeAutoRefresh) {
        configuration.treeAutoRefresh = this.application.treeAutoRefresh;
      }
      configuration.parameters = null;
      if (this.application.parameters) {
        configuration.parameters = this.application.parameters;
      }
    }
    if (this.treeComponentEnabled) {
      this.applicationConfiguration = configuration?configuration:null;
    } else {
      //Send configuration directly to the map
      this.updateMapComponentMapOptions(configuration);
    }
  }

  //Inserts an object into an array in the position defined by its order property (should it be defined)
  insertInOrder(elements, element) {
    if ((element) && (elements)) {
      if (element.order == null) {
        //Insert at the end
        elements.push(element);
      } else {
        var index = -1;
        for (var i = 0, iLen = elements.length; i < iLen; i++) {
          if ((elements[i].order == null) || (elements[i].order > element.order)) {
            index = i;
            break;
          }
        }
        if (index == -1) {
          elements.push(element);
        } else {
          //Insert the element into the array at the index position without deleting any elements
          elements.splice(index, 0, element);
        }
      }
    }
  }

  //TREE PARSING FUNCTIONS
  //FIXME OPTIMIZE LAYER PARSING DELETE parseLayerConfiguration uses

  //Inserts an object into an array in the position defined by the order parameter (should it be defined)
  //and updates an elements position array
  insertByOrder(elements, elementsOrder, element, order) {
    if (element && elements && elementsOrder && (order != null)) {
      var index = -1;
      for (var i = 0, iLen = elementsOrder.length; i < iLen; i++) {
        if ((elementsOrder[i] == null) || (elementsOrder[i] > order)) {
          index = i;
          break;
        }
      }
      if (index == -1) {
          elements.push(element);
          elementsOrder.push(order);
      } else {
          //Insert the element into the array at the index position without deleting any elements
          elements.splice(index, 0, element);
          elementsOrder.splice(index, 0, order);
      }
    } else {
      elements.push(element);
      elementsOrder.push(order);
    }
  }

  parseLayerConfiguration(layerConfiguration) {
    var layer:Layer;
    layer = new Layer();

    if (layerConfiguration.visibility != undefined) {
      layer.visibility = layerConfiguration.visibility;
    }
    if (layerConfiguration.opacity != undefined) {
      layer.opacity = layerConfiguration.opacity;
    }
    if (layerConfiguration.label != undefined) {
      layer.title = layerConfiguration.label;
    }
    if (layerConfiguration.serverLayerName != undefined) {
      layer.serverName = layerConfiguration.serverLayerName;
    }
    //If no id is defined use serverName
    if (layerConfiguration.id != undefined) {
      layer.id = layerConfiguration.id;
    } else {
      layer.id = layer.serverName;
    }
    if (layerConfiguration.attribution != undefined) {
      layer.attributions = layerConfiguration.attribution;
    }
    if (layerConfiguration.format != undefined) {
      layer.format = layerConfiguration.format;
    }
    if (layerConfiguration.version != undefined) {
      layer.version = layerConfiguration.version;
    }
    if (layerConfiguration.wmsUrl != undefined) {
      layer.url = layerConfiguration.wmsUrl;
    }
    if (layerConfiguration.queryable != undefined) {
      layer.queryable = layerConfiguration.queryable;
    }
    if (layerConfiguration.isBaseLayer != undefined) {
      layer.isBaseLayer = layerConfiguration.isBaseLayer;
    }
    if (layerConfiguration.wmsLayers != undefined) {
      layer.name = layerConfiguration.wmsLayers;
    }
    if (layerConfiguration.singleTile != undefined) {
      layer.tiled = !layerConfiguration.singleTile;
    }
    if (layer.tiled) {
        //If no tile size is defined the default will be used
        if (layerConfiguration.tileSize) {
          layer.tileHeight = layerConfiguration.tileSize;
          layer.tileWidth = layerConfiguration.tileSize;
        }
    }
    if (layerConfiguration.desc != undefined) {
      layer.desc = layerConfiguration.desc;
    }
    if (layerConfiguration.url_transparent != undefined) {
      layer.url_transparent = layerConfiguration.url_transparent;
    }
    if (layerConfiguration.url_exception != undefined) {
      layer.url_exception = layerConfiguration.url_exception;
    }      
    if (layerConfiguration.url_bgcolor != undefined) {
      layer.url_bgcolor = layerConfiguration.url_bgcolor;
    }
    if (layerConfiguration.extent != undefined) {
      layer.extent = layerConfiguration.extent;
    }
    if (layerConfiguration.minimumScale != undefined) {
      layer.minimumScale = layerConfiguration.minimumScale;
    }
    if (layerConfiguration.maximumScale != undefined) {
      layer.maximumScale = layerConfiguration.maximumScale;
    }
    if (layerConfiguration.projections != undefined) {
      layer.projections = layerConfiguration.projections;
    }
    if (layerConfiguration.infoUrl != undefined) {
      layer.infoUrl = layerConfiguration.infoUrl;
    }
    if (layerConfiguration.metadataUrl != undefined) {
      layer.metadataUrl = layerConfiguration.metadataUrl;
    }
    if (layerConfiguration.legendUrl != undefined) {
      layer.legendUrl = layerConfiguration.legendUrl;
    }
    if (layerConfiguration.optionalParameters != undefined) {
        layer.optionalParameters = layerConfiguration.optionalParameters;
    }

    return layer;
  }

  getDefaultAttribution ():string {
    return this.defaultAttribution;
  }

  // Translate the app Cartography configuration into a Tree Component Layer configuration
  parseCartography(cartography, isBackground, topics) {
    var layerConfig = null;
    if (cartography) {
      var parameterList;
      var parameter;
      var parameterName:string;
      var optionalParameter: OptionalParameter;

      layerConfig = {};

      layerConfig.serverLayerName = this.getElementId(cartography);//Retrieve the object's unique id
      layerConfig.background = isBackground;
      layerConfig.isBaseLayer = false;// If true the layer is moved to the bottom of the visible stack
      layerConfig.visible = cartography.visible;
      //Transform to opacity
      layerConfig.opacity = 1;
      if ((cartography.transparency != undefined) && (cartography.transparency != null)) {
          layerConfig.opacity = Math.abs(1 - cartography.transparency/100);
      }
      layerConfig.queryable = cartography.queryable;//Currently not supported 
      //cartography.queryAct;//Currently not supported
      //cartography.queryLay;//Currently not supported

      //Order of the layer in its group
      layerConfig.order = cartography.order;

      layerConfig.minimumScale = cartography.minimumScale;
      layerConfig.maximumScale = cartography.maximumScale;

      layerConfig.wmsLayers = cartography.layers;
      if (cartography.service) {
        //Service type values (wms, wmts...)
        layerConfig.type = cartography.service.type;
        if (layerConfig.type) {
          layerConfig.type = layerConfig.type.toLowerCase();
          layerConfig.singleTile = (layerConfig.type == "wms");
        } else {
          layerConfig.singleTile = true;
        }
        layerConfig.wmsUrl = cartography.service.url;                      
        cartography.service.projections;//Currently not supported
        if (cartography.service.legend) {
          layerConfig.hasLegend = true;
          layerConfig.legendUrl = cartography.service.legend;
        } else {
          layerConfig.hasLegend = false;
        }
                  
        layerConfig.infoUrl = cartography.service.infoUrl;
        layerConfig.projections = cartography.service.projections;
        //cartography.service.connection;//Currently not supported

        //Retrieve specific information to make the OGC service requests
        parameterList = cartography.service.parameters;
        if (parameterList && parameterList.length) {
          for (var z = 0, zLen = parameterList.length; z < zLen; z++) {
            parameter = parameterList[z];
            if (parameter.name) {
              parameterName = parameter.name.toLowerCase();
              switch(parameterName) {
                case 'transparent': 
                                    layerConfig.url_transparent = parameter.value;
                                    break;
                case 'exception':
                                    layerConfig.url_exception = parameter.value;
                                    break;
                case 'version':
                                    layerConfig.version = parameter.value;
                                    break;
                case 'bgcolor':
                                    layerConfig.url_bgcolor = parameter.value;
                                    break;
                case 'format':
                                    layerConfig.format = parameter.value;
                                    break;
                case 'attribution':
                                    layerConfig.attribution = parameter.value;
                                    break;
                case 'attributionurl':
                                    layerConfig.attributionUrl = parameter.value;
                                    break;
                case 'tiled':
                                    var parsedValue = parameter.value.toLowerCase();
                                    layerConfig.singleTile = (parsedValue != "true");
                                    break;
                case 'tilesize':
                                    layerConfig.tileSize = parameter.value;
                                    break;
                case 'extent':
                                    if ((parameter.value.indexOf("[") != -1) && 
                                        (parameter.value.indexOf("]") != -1)) {
                                      layerConfig.extent = JSON.parse(parameter.value);
                                    }
                                    break;
                default:            if (!layerConfig.optionalParameters) {
                                      layerConfig.optionalParameters = new Array<OptionalParameter>();
                                    }
                                    optionalParameter = new OptionalParameter();
                                    optionalParameter.key = parameter.name;
                                    optionalParameter.value = parameter.value;
                                    layerConfig.optionalParameters.push(optionalParameter);
              }

            }
          }
        }
      }

      //Other properties not supported currently
      /*
      "label": string,
      "attribution": string,
      "attributionUrl": string,
      "extent": Array<Number>(4),//extent
      "highlightable": bool,
      "chargeable": bool,
      "searchable": bool,
      "timeEnabled": bool,
      "tooltip": bool,
      "topics": string,
      */
      //Default values in the meantime
      if (!layerConfig.url_transparent) {
        layerConfig.url_transparent = "TRUE";
      }
      /*if (!layerConfig.url_exception) {
        layerConfig.url_exception = "INIMAGE";
      }*/
      if (!layerConfig.version) {
        layerConfig.version = "1.3.0";
      }
      /*if (!layerConfig.url_bgcolor) {
        layerConfig.url_bgcolor = "0x000000";
      }*/
      if (!layerConfig.format) {
        layerConfig.format = "png";
      }

      //Asign the tree node label value to be
      layerConfig.label = cartography.name;

      //Define an attribution 
      if (!layerConfig.attribution) {
          //Get the default attribution
          layerConfig.attribution = this.getDefaultAttribution();//"";
      }
      if (!layerConfig.attributionUrl) {
          layerConfig.attributionUrl = "";
      }

      //Mandatory set an extent in case of a WMTS layer
      if (!layerConfig.extent) {
          layerConfig.extent = null;
      }
      if ((layerConfig.type == "wmts") && (!layerConfig.extent)) {
        layerConfig.extent = [254904.96, 4484796.89, 530907.30, 4749795.10];
        layerConfig.extentProjection = "EPSG:25831";
      }
      layerConfig.highlightable = false;
      layerConfig.chargeable = false;
      layerConfig.searchable = false;
      
      layerConfig.timeEnabled = false;
      layerConfig.tooltip = true; //Tooltip enabled (geoadmin tree module configuration attribute)
      layerConfig.topics = topics;//Topic id array that this layer is related to (geoadmin tree module configuration attribute)

      //cartography.connection;//Currently not supported
      //cartography.availabilities;//Currently not supported
      //cartography.selectable;//Currently not supported
      //cartography.selectionLayer;//Currently not supported
      //cartography.selectionService;//Currently not supported
      if (cartography.legendTip) {//Currently not supported
        layerConfig.nodeTooltip = cartography.legendTip;
      } else {
        layerConfig.nodeTooltip = cartography.name;
      }
      if (cartography.legendUrl) {
        //Overrides the data from service
        layerConfig.hasLegend = true;
        layerConfig.legendUrl = cartography.legendUrl;
      } else {
        layerConfig.hasLegend = false;
      }//Currently not used

      //cartography.editable;//Currently not supported
      layerConfig.metadataUrl = cartography.metadataUrl;
      //cartography.themeable;//Currently not supported
      //cartography.geometryType;//Currently not supported
      
      //FIXME improve metadata requests in the tree disabling
      layerConfig.metadataInfoToolDisabled = true;//Disable the display of the metadata info retrieval button in the tree for this layer

      //Check if the layer configuration is correct
      if (!this.checkLayerConfig(layerConfig)) {
        return null;
      }
    }
    return layerConfig;
  }

  //Checks if the layer configuration complies with the format restrictions, 
  //having the minimum mandatory attributes defined 
  checkLayerConfig(layerConfig) {
    if (!layerConfig.wmsUrl || !layerConfig.wmsLayers) {
      return false;
    }
    if (((layerConfig.type == "wmts") || !layerConfig.singleTile) && !layerConfig.extent) {
      return false;
    }
    return true;
  }
  getMapComponentSituationMapConfiguration(situationMapConfiguration:CartographyGroup) {
    let situationMapLayersConfiguration:Array<Layer> = new Array<Layer>();
    if (situationMapConfiguration) {
      var cartographyGroup = situationMapConfiguration;
      var layerName;
      var cartographyList;
      var layerConfig;
      var cartographyGroupId;
      if (cartographyGroup) {
        layerName = "situation-map";
        cartographyGroupId = this.getElementId(cartographyGroup);
        if (cartographyGroupId) {
          layerName += (layerName?"-":"") + cartographyGroupId; //update the layer id
        }
        //cartographyGroup.type; //Currently not supported
        cartographyList = cartographyGroup.members;
        //Parse the members cartographies
        if (cartographyList && cartographyList.length) {
          for (var j = 0, jLen = cartographyList.length; j < jLen; j++) {
            //The topic does not matter for this layers, it is defined as all
            layerConfig = this.parseCartography(cartographyList[j], true, "all");
            if (layerConfig) {
              if (situationMapLayersConfiguration == null) {
                situationMapLayersConfiguration = [];
              }
              layerConfig.serverLayerName = 
                layerName + (layerName?"-":"") + layerConfig.serverLayerName;
              this.insertInOrder(situationMapLayersConfiguration, layerConfig);
            }
          }
        }
      }
    }

    situationMapLayersConfiguration.forEach(function(layer, index, layers) {
      //All the situation map configuation layers are visible
      layer.visibility = true;
    });
    return situationMapLayersConfiguration;
  }

  updateMapComponentSituationMap(situationMapConfiguration:CartographyGroup) {
    var layers = this.getMapComponentSituationMapConfiguration(situationMapConfiguration);
    var parsedLayers = [];
    for (var i = 0, iLen = layers.length; i < iLen; i++) {
      parsedLayers.push(this.parseLayerConfiguration(layers[i]));
    }
    this.mapConfigurationManagerService.loadSituationMapConfiguration(parsedLayers);
  }

  //Recursive function to translate the app TreeNode information into a TreeModule node configuration
  treeNodeParserRec(node, treeId, level, categoryNodes, layersConfiguration, activatedLayerNames) {
    if (!node) {
      return;
    }
    var nodeName = "";
    if (node.parent) {
      this.treeNodeParserRec(node.parent, treeId, level+1, categoryNodes, layersConfiguration, activatedLayerNames);
    }
    var categoryNode = null;
    var elementId = this.getElementId(node);
    if (level == 0) {
      //Create the node hierarchy
      var layerConfig = this.parseCartography(node.cartography, false, treeId);
      if (layerConfig) {
        var label;
        if (node.tooltip) {
          label = node.tooltip;
        } else if (node.name) {
          label = node.name;
        }
        layerConfig.label = label;
        layerConfig.serverLayerName = elementId + (elementId?"-":"") + layerConfig.serverLayerName;
        if (node.active) {
          //Active (visible) layers
          activatedLayerNames.push(layerConfig.serverLayerName);
        }
        if (layersConfiguration == null) {
            layersConfiguration = {};
        }
        layersConfiguration[layerConfig.serverLayerName] = layerConfig;
        categoryNode = {
          "orden": node.ordee,
          "category": "layer",
          "staging": "prod",
          "label": label,
          "layerBodId": layerConfig.serverLayerName,
          "id": this.uniqueId++
        };
      }
    } else {
      var label;
      if (node.tooltip) {
        label = node.tooltip;
      } else if (node.name) {
        label = node.name;
      }
      //Create a node group if it does not exist and add it to the parent children node list
      if (!categoryNodes[elementId]) {
        categoryNode = {
          "orden": node.ordee,
          "category": "topic",
          "staging": "prod",
          "selectedOpen": node.active,
          "children": [],
          "label": label,
          "id": this.uniqueId++
        };
        categoryNodes[elementId] = categoryNode;
      }
    }
    //Add to hierarchy
    if (categoryNode) {
      if (node.parent != null) {
        var parentId = this.getElementId(node.parent);
        if (categoryNodes[parentId]) {
          //Insert in the defined position
          this.insertInOrder(categoryNodes[parentId].children, categoryNode);
        }
      } else {
        if (categoryNodes["root"]) {
          //Insert in the defined position
          this.insertInOrder(categoryNodes["root"].children, categoryNode);
        }
      }
    }
  }

  //Translate app tree array configuration into Tree Component tree configuration
  parseTreesConfiguration(trees) {

    // Builds or updates the layersConfiguration
    // Builds topics configuration
    // Builds catalogs configuration
    var layersConfiguration = null;
    var topicsConfiguration = null;
    var catalogsConfiguration = null;
    if (trees && trees.length) {
      var tree/*:Tree*/;
      var treeNode/*:TreeNode*/;
      var activatedLayerNames;
      var catalog;
      var catalogNodeList;
      var catalogNodes;
      var node;
      var baseLayerName;
      var layerName;
      var nodeName;
      var treeId;
      var tempLayersConfiguration;
      for (var i = 0, iLen = trees.length; i < iLen; i++) {
        tree = trees[i];
        catalog  = null;
        catalogNodes = null;
        if (tree) {
          treeId = this.getElementId(tree);
          baseLayerName = treeId;
          if (tree.nodes && tree.nodes.length) {
            activatedLayerNames = [];
            catalogNodes = {
              "root": {
                "category": "root",
                "staging": "prod",
                "id": this.uniqueId++,
                "children": []
              }
            };

            tempLayersConfiguration = {};
            for (var j = 0, jLen = tree.nodes.length; j < jLen; j++) {
              treeNode = tree.nodes[j];
              layerName = baseLayerName;
              if (treeNode) {
                //Recursive hierarchy retrieval treeNode.name should be a unique id
                this.treeNodeParserRec(treeNode, treeId, 0, catalogNodes, tempLayersConfiguration, 
                                  activatedLayerNames);
              }
            }
            
            if (tempLayersConfiguration && (Object.getOwnPropertyNames(tempLayersConfiguration).length > 0)) {
              //If no layers have been added the topics won't be considered
              if (catalogNodes && catalogNodes["root"]) {
                  var treeRoot = catalogNodes["root"];
                  if (treeRoot.children && treeRoot.children.length) {
                  catalog = {
                    "results": {
                      "root": catalogNodes["root"]
                    }
                  };
                }
              }               
              if (catalog) {
                  if (catalogsConfiguration == null) {
                  catalogsConfiguration = {};
                  }
                  catalogsConfiguration[treeId] = catalog;
              }
              if (topicsConfiguration == null) {
                  topicsConfiguration = {};
                  topicsConfiguration.topics = [];
                  topicsConfiguration.baseGroups = [];
              }
              topicsConfiguration.topics.push({
                  "defaultBackground": "",//Does not matter
                  "plConfig": null,
                  "selectedLayers": activatedLayerNames,
                  "backgroundLayers": [],
                  "groupId": 1,//Used to order the list of topics in the topic selection window
                  "activatedLayers": activatedLayerNames,
                  "id": treeId,
                  "name": tree.name
              });
              if (layersConfiguration == null) {
                layersConfiguration = {};
              }

              //Update the layers configuration object
              for (var pName in tempLayersConfiguration) {
                layersConfiguration[pName] = 
                  tempLayersConfiguration[pName];
              }
            }
          }
        }
      }
      if (layersConfiguration && (Object.getOwnPropertyNames(layersConfiguration).length == 0)) {
          layersConfiguration = null;
          topicsConfiguration = null;
          catalogsConfiguration = null;
      }
      return {
        layersConfiguration: layersConfiguration,
        topicsConfiguration: topicsConfiguration,
        catalogsConfiguration: catalogsConfiguration
      }
    }
    return null;
  }

  getMapcomponentLayersConfiguration(trees:Tree[]) {
    let layers:Array<Layer> = new Array<Layer>();

    //FIXME should we parse the first the selected tree only  or the active cartographies only
    var parsedConfiguration = this.parseTreesConfiguration([trees[0]]);
    if (parsedConfiguration && parsedConfiguration.layersConfiguration) {
      for (var i in parsedConfiguration.layersConfiguration) {
        layers.push(this.parseLayerConfiguration(parsedConfiguration.layersConfiguration[i]));
      }
    }
    //Set the activated layers visibility
    if (parsedConfiguration.topicsConfiguration && 
        parsedConfiguration.topicsConfiguration.topics &&
        parsedConfiguration.topicsConfiguration.topics.length) {
      var activatedLayers = parsedConfiguration.topicsConfiguration.topics[0]["activatedLayers"];
      if (activatedLayers && activatedLayers.length) {
        layers.forEach(function(layer, index, layers) {
          layer.visibility = activatedLayers.indexOf(layer.serverName) != -1;
        })
      }
    }
    
    return layers;
  }

  updateMapComponentLayers(treesConfiguration:Tree[]) {
    this.mapConfigurationManagerService.loadLayersConfiguration(
      this.getMapcomponentLayersConfiguration(treesConfiguration));
  }

  parseBackgroundsConfiguration(backgrounds) {
    // Builds the map baselayers and base layer groups
    // Builds or updates the layersConfiguration adding the baselayers
    var layersConfiguration = null;
    var topicsConfiguration = null;
    if (backgrounds && backgrounds.length) {
      //If a layer with the name cartography.name is already defined it will be overriden

      var applicationBackground/*:ApplicationBackground*/;
      var cartographyList/*:Array<Cartography>*/;
      var cartography/*:Cartography*/;
      var layerConfig;
      var baseLayerNames;
      var baseLayerOrders;
      var layerName;
      var applicationBackgroundId;

      var backgroundId;
      var groupId;
      for (var i = 0, iLen = backgrounds.length; i < iLen; i++) {
        applicationBackground = backgrounds[i];
        applicationBackgroundId = this.getElementId(applicationBackground);
        layerName = applicationBackgroundId;
        if (applicationBackground.background) {
          layerName += (layerName?"-":"") + this.getElementId(applicationBackground.background);
          if (applicationBackground.background.cartographyGroup) {
            baseLayerNames = [];
            baseLayerOrders = [];
            groupId = this.getElementId(applicationBackground.background.cartographyGroup);
            if (groupId) {
              layerName += (layerName?"-":"") + groupId; //Update the layer id
            }
            //applicationBackground.background.cartographyGroup.type; //Currently not supported
            cartographyList = applicationBackground.background.cartographyGroup.members;
            //Parse the members cartographies
            if (cartographyList && cartographyList.length) {
              for (var j = 0, jLen = cartographyList.length; j < jLen; j++) {
                //The topic does not matter for this layers, it is defined as all
                layerConfig = this.parseCartography(cartographyList[j], true, "all");
                if (layerConfig) {
                  if (layersConfiguration == null) {
                    layersConfiguration = {};
                  }
                  layerConfig.serverLayerName = 
                    layerName + (layerName?"-":"") + layerConfig.serverLayerName;
                  layersConfiguration[layerConfig.serverLayerName] = layerConfig;
                  //Insert the element in the right order
                  this.insertByOrder(baseLayerNames, baseLayerOrders, layerConfig.serverLayerName, 
                                layerConfig.order);
                }
              }
              if (topicsConfiguration == null) {
                topicsConfiguration = {};
                topicsConfiguration.topics = [];
                topicsConfiguration.baseGroups = [];
              }
              //Insert the element in the right order
              this.insertInOrder(topicsConfiguration.baseGroups, {
                active: applicationBackground.background.active,//Only one background should be visible
                                                                //if more than one are marked as visible 
                                                                //then the last active one defined will
                                                                //be the one displayed initially
                order: applicationBackground.order,//Will be ignored by the tree only for 
                                                   //generating the correct structure purposes
                  //FIXME If a map generic base layer/layer group selector is defined use that value
                id: applicationBackground.background.name,
                layers: baseLayerNames,
                name: applicationBackground.background.name
              });
            }
          }
        }
      }
      return {
        layersConfiguration: layersConfiguration,
        topicsConfiguration: topicsConfiguration
      }
    }
    return null;
  }

  getMapComponentBaseLayersConfiguration(backgrounds: ApplicationBackground[]) {
    let groups:Array<LayerGroup> = new Array<LayerGroup>();

    var configuration = this.parseBackgroundsConfiguration(backgrounds);

    if ((configuration != null) && (configuration.layersConfiguration != null) && 
        (configuration.topicsConfiguration != null) && 
        (configuration.topicsConfiguration.baseGroups != null)) {
      var groupsConfiguration = configuration.topicsConfiguration.baseGroups;
      var layersConfiguration = configuration.layersConfiguration;
      var group;
      var config;
      var groupActivated = false;
      for (var i = 0, iLen = groupsConfiguration.length; i < iLen; i++) {
        group = new LayerGroup();
        config = groupsConfiguration[i];
        group.active = config.active && !groupActivated;
        if (group.active) {
          groupActivated = true;
        }
        group.id = config.id;
        group.layers = new Array<Layer>();
        var layer;
        if (config.layers && config.layers.length) {
          for (var j = 0, jLen = config.layers.length; j < jLen; j++) {
            layer = config.layers[j];
            if (layer) {
                //Retrieve the tree component layers configuration
              layer = layersConfiguration[layer];
              if (layer) {
                //Translate the tree component layers configuration into a map component configuration
                group.layers.push(this.parseLayerConfiguration(layer));
              }
            }
          }
        }
        groups.push(group);
      }
    }

    return groups;
  }

  updateMapComponentBackgrounds(backgrounds: ApplicationBackground[]) {
    this.mapConfigurationManagerService.loadBaseLayersConfiguration(
      this.getMapComponentBaseLayersConfiguration(backgrounds));
  }

  parseApplicationConfiguration(configuration) {
    /*
      //Enabled configuration values
        type: string;
        theme: string;
        scales: string;
        projections: string;
        treeAutoRefresh: Boolean;
        parameters: ApplicationParameter[];
    */
    var optionsConfiguration = new MapOptionsConfiguration();
    if (configuration) {
      if (configuration.scales) {
        optionsConfiguration.scales = configuration.scales;
      }
      if (configuration.projections) {
        optionsConfiguration.projections = configuration.projections;
      }
      if (configuration.parameters && (configuration.parameters.length > 0)) {
        optionsConfiguration.parameters = new Array<OptionalParameter>();
        var parameter;
        for (var i = 0, iLen = configuration.parameters.length; i < iLen; i++) {
          try {
            switch(configuration.parameters[i].name.toLowerCase()) {
              case "minScale":
                configuration.minScale = eval(configuration.parameters[i].value);
                break;
              case "maxScale":
                configuration.maxScale = eval(configuration.parameters[i].value);
                break;
              case "extent":
                configuration.extent = eval(configuration.parameters[i].value);
                break;
              //FIXME get from Territory
              case "maxExtent":
                configuration.maxExtent = eval(configuration.parameters[i].value);
                break;
              case "tileWidth":
                configuration.tileWidth = eval(configuration.parameters[i].value);
                break;
              case "tileHeight":
                configuration.tileHeight = eval(configuration.parameters[i].value);
                break;
              default:
                parameter = new OptionalParameter();
                parameter.key = configuration.parameters[i].name;
                parameter.value = configuration.parameters[i].value;
                optionsConfiguration.parameters.push(parameter);
            }
          } catch(e) {
            parameter = new OptionalParameter();
            parameter.key = configuration.parameters[i].name;
            parameter.value = configuration.parameters[i].value;
            optionsConfiguration.parameters.push(parameter);
          }
        }
      }
    }
    return optionsConfiguration;
  }

  getMapComponentMapOptionsConfiguration(configuration:ApplicationConfiguration) {;
    return this.parseApplicationConfiguration(configuration);
  }

  updateMapComponentMapOptions(configuration:ApplicationConfiguration) {
    this.mapConfigurationManagerService.loadMapOptionsConfiguration(
      this.getMapComponentMapOptionsConfiguration(configuration));
  }

  getCartographyData() {
    //Store the object reference to access it in the onComplete anonymous functions
    var this_ = this;

    this.application.getRelationArray(ApplicationBackground, 'backgrounds').subscribe(
      (applicationBackgrounds: ApplicationBackground[]) => {
      this.application.backgrounds = applicationBackgrounds;
      this.resolveApplicationBackgrounds(this.application.backgrounds, 0, 
        function() {
          //On complete
          this_.updateApplicationBackgroundsConfiguration(this_.application?this_.application.backgrounds:null);
        });
    },
      error => this.application.backgrounds= new Array<ApplicationBackground>());
    this.application.getRelation(CartographyGroup, 'situationMap').subscribe(
            (situationMap: CartographyGroup) => 
            {
                this.application.situationMap = situationMap;
                this.resolveCartographyGroup(this.application.situationMap,
                function() {
                  //On complete
                  this_.updateSituationMapConfiguration(this_.application?this_.application.situationMap:null);
                });
            },
            error => this.application.situationMap = new CartographyGroup());

    this.application.getRelationArray(Tree, 'trees').subscribe(
            (trees: Tree[]) => {
            this.application.trees = trees;
            this.resolveTrees(this.application.trees, 0,
              function() {
                //On complete
                this_.updateTreesConfiguration(this_.application?this_.application.trees:null);
              });
        },
            error => this.application.trees= new Array<Tree>());
  }

  getApplicationData() {
    if (this.id == null) {
      //Get the existing applications and find the Territorial App's id
      this.applicationService.getAll().subscribe((applications: Application[]) => {
        if (applications) {
          var application:Application;
          var found:Boolean = false;
          for (var i = 0, iLen = applications.length; i < iLen; i++) {
            application = applications[i];
            if (application != null) {
              if ((application.name != null) && 
                  (application.name.toLowerCase() == 
                   TERRITORIAL_APP_NAME.toLowerCase())) {
                  this.id = this.getElementId(application);
                  found = true;
                  break;
              }
            }
          }
          if (found) {
            this.getTerritorialApplicationData();      
          } else {
            //Behaviour on fail or user not logged
            this.loadDefaultApplicationConfiguration();    
          }
        } else {
          console.log(`No applications found, returning to list`);
          //TODO behaviour on information not found
          this.loadDefaultApplicationConfiguration();
        }
      },
      (error:any) => {
        //Behaviour on fail or user not logged
       this.loadDefaultApplicationConfiguration();
      });
    } else {
      //The Territorial app's id has already been initialized, just request its data
      this.getTerritorialApplicationData();    
    }
  }

  getTerritorialApplicationData() {
    if (this.id) {
      this.applicationService.get(this.id).subscribe((application: any) => {
        if (application) {
          this.application = application;
          this.application.createdDate = new Date();
          this.application.createdDate.setTime(Date.parse(application.createdDate));

          //Store the object reference to access it in the onComplete anonymous functions
          var this_ = this;

          this.application.getRelationArray(ApplicationParameter, 'parameters').subscribe(
                (applicationParameters: ApplicationParameter[]) => {
                  
                this_.application.parameters = applicationParameters;
                this_.updateApplicationConfiguration();
                this_.getCartographyData();
              },
              error => this.application.parameters= new Array<ApplicationParameter>());

          //delete this.application._links;
        } else {
          console.log(`application with id '${this.id}' not found, returning to list`);
          //TODO behaviour on information not found
          this.loadDefaultApplicationConfiguration();
        }
      },
      (error:any) => {
        //Behaviour on fail or user not logged
       this.loadDefaultApplicationConfiguration();
      });
    }
  }

  availableCartographies;
  resolveCartographyAvailabilities(cartographyAvailabilities:CartographyAvailability[], index, onComplete?) {
    if (cartographyAvailabilities) {
      if (index < cartographyAvailabilities.length) {
        var cartographyAvailability = cartographyAvailabilities[index];
        var this_ = this;
        cartographyAvailability.getRelation(Cartography, "cartography").finally(
          function() {
            //triggered whether finished gracefully or not, resolve next task availability
            this_.resolveCartographyAvailabilities(cartographyAvailabilities, index+1, onComplete);
        }).subscribe(
          (cartography:Cartography)=>{
            //store the available cartografies by id
            if (!this.availableCartographies) {
              this.availableCartographies = [];
            }
            this.availableCartographies[this.getElementId(cartography)] = cartography;
          },
          error => {
            console.log(`Could not retrieve Cartography information for cartographyAvailavility with id '${this_.getElementId(cartographyAvailability)}'`);          
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

  getAvailableCartographiesData() {
    //get tasks availability
    this.cartographyAvailabilityService.getAll().subscribe((cartographyAvailabilities: CartographyAvailability[]) => {
      //Parse tasks
      var this_ = this;
      this.resolveCartographyAvailabilities(cartographyAvailabilities, 0, 
        function() {
          //OnComplete
          this_.getApplicationData();  
        });
    }, 
    (error:any) => {
      //Behaviour on fail or user not logged
      this.getApplicationData();
    });
  }

  resolveTaskAvailabilities(taskAvailabilities:TaskAvailability[], index, onComplete?) {
    if (taskAvailabilities) {
      if (index < taskAvailabilities.length) {
        var taskAvailability = taskAvailabilities[index];
        var this_ = this;
        taskAvailability.getRelation(Task, "task").finally(
          function() {
            //triggered whether finished gracefully or not, resolve next task availability
            this_.resolveTaskAvailabilities(taskAvailabilities, index+1, onComplete);
        }).subscribe(
          (task:Task)=>{
            //Parse task
            if (this.isTreeComponentTask(task)) {
              //Enable tree should its corresponding task be available
              this.enableTreeComponent(true);
            }
          },
          error => {
            console.log(`Could not retrieve Task information for TaskAvailavility with id '${this_.getElementId(taskAvailability)}'`);          
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

  getTaskData() {
    //get tasks availability
    this.taskAvailabilityService.getAll().subscribe((taskAvailabilities: TaskAvailability[]) => {
      //Parse tasks
      var this_ = this;
      this.resolveTaskAvailabilities(taskAvailabilities, 0, 
        function() {
          //OnComplete
          this_.getAvailableCartographiesData();  
        });
    }, 
    (error:any) => {
      //Behaviour on fail or user not logged
      this.loadDefaultTaskConfiguration();
      this.getAvailableCartographiesData();
    });

    //get tasks
    /*
    this.taskService.getAll().subscribe((tasks: Task[]) => {
      //Parse tasks
      var enableTree;
      var task:Task;
      for (var i = 0, iLen = tasks.length; i < iLen; i++) {
        task = tasks[i];
        if (this.isTreeComponentTask(task)) {
          enableTree = true;
          break;
        }
      }
      this.enableTreeComponent(enableTree);
      this.getApplicationData();
    },
    (error:any) => {
      //Behaviour on fail or user not logged
     this.loadDefaultTaskConfiguration();
     this.getApplicationData();
    });
    */
  }

  subscribed = false;
  ngOnInit() {
      this.initializeDefaultValues();

      //Detect the app language selection and notify the angularjs tree module
      this.translationService.onLangChange.subscribe((params: LangChangeEvent) => {
        if (!this.languageConfiguration || (params.lang && (this.languageConfiguration != params.lang))) {
          this.languageConfiguration = params.lang;
        }
      });

      //Wait for the map component to be loaded
      var mapStatusListener = this.mapConfigurationManagerService.getMapComponentStatusListener().subscribe(
        (status:MapComponentStatus[]) => {
          if ((status != null) && (status.length > 0)) {
            if (status[0].loaded) {
              if (mapStatusListener) {
                mapStatusListener.unsubscribe();
              }
              if (!this.subscribed) {
                this.subscribed = true;
                this.getTaskData();
              }
            }
          }
        },
        (error:any) => {
          console.log("Error getting MapComponent status");
        }
      );     
  }

  treeComponentEnabled:boolean  = false;
  enableTreeComponent(enable:boolean) {
    this.treeComponentEnabled = enable;
  }

  //Check if the task refers to the Tree Plugin
  isTreeComponentTask(task:Task):boolean {
    return (task && task.name && 
        (task.name.toLowerCase().indexOf(GEOADMIN_TREE_TASK_ID) != -1));
  }

  loadDefaultTaskConfiguration() {
    this.enableTreeComponent(false);
  }

  //Hardcoded default tree component content configuration

  getDefaultTreesConfiguration() {
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
    defaultTree.nodes = [];
    
    var node = new TreeNode();
    node.name = "Transporte";
    node.tooltip = "Transporte";
    node.orden = 1;
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
    cartography.queryable = true;
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
    defaultTree.nodes.push(node);

    return [defaultTree];
  }

  getDefaultSituationMapConfiguration(){
    var cartographyGroup = new CartographyGroup();
    cartographyGroup.name = "Grupo 1. Fondo Mapa App territorial";
    cartographyGroup.type = "Fondo";

    var cartography = new Cartography();
    cartography["name"] = "Base Mapa - imgeix";
    cartography["type"] = null;
    cartography["visible"] = true,
    cartography["transparency"] = 0;
    cartography["queryable"] = false;
    cartography["queryAct"] = null;
    cartography["queryLay"] = null;
    cartography["createdDate"] = "2018-09-25T14:32:25.000+0000";
    cartography["order"] = 3;
    cartography["minimumScale"] = null;
    cartography["maximumScale"] = null;
    cartography["layers"] = "M_EIX_ET,M_EDI_ET,M_MUNIS_ET";
    cartography["selectable"] = null;
    cartography["selectionLayer"] = null;
    cartography["legendTip"] = null;
    cartography["legendUrl"] = null;
    cartography["editable"] = null;
    cartography["metadataUrl"] = null;
    cartography["themeable"] = null;
    cartography["geometryType"] = null;
    cartography["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247"
        },
        "cartography": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247"
        },
        "availabilities": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247/availabilities"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247/service"
        },
        "selectionService": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247/selectionService"
        },
        "connection": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247/connection"
        }
    };
    var service = new Service();
    service["name"] = "WMS DIBA Public";
    service["url"] = "http://sitmun.diba.cat/arcgis/services/PUBLIC/GCA_WEB/MapServer/WMSServer";
    service["projections"] = "EPSG:25831";
    service["legend"] = "http://sitmun.diba.cat/arcgis/services/PUBLIC/GCA_WEB/MapServer/WMSServer";
    service["type"] = "WMS";
    service["infoUrl"] = "http://sitmun.diba.cat/arcgis/services/PUBLIC/GCA_WEB/MapServer/WMSServer";
    service["createdDate"] = "2018-09-18T17:14:29.000+0000";
    service["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/235"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/235"
        },
        "layers": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/235/layers"
        },
        "parameters": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/235/parameters"
        },
        "connection": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/235/connection"
        }
    };
    service["layers"] = null;
    service["connection"] = null;
      
    var parameters = [];
    var parameter = new ServiceParameter();
    parameter.name = "version";
    parameter.value = "1.1.0";
    parameter.type = "WMS";
    parameter._links = {
        "self": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/236"
        },
        "serviceParameter": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/236"
        },
        "service": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/236/service"
        }
      };
    parameters.push(parameter);
    
    parameter = new ServiceParameter();
    parameter.name = "format";
    parameter.value = "png";
    parameter.type = "WMS";
    parameter._links = {
      "self": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/237"
      },
      "serviceParameter": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/237"
      },
      "service": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/237/service"
      }
    };
    parameters.push(parameter);
    service.parameters = parameters;

    cartography.service = service;
    cartography.availabilities = null;
    cartography.selectionService = null;
    cartography.connection = null;

    cartographyGroup.members = [];
    cartographyGroup.members.push(cartography);

    cartography = new Cartography();
    cartography["name"] = "Base Mapa - imgmapa";
    cartography["type"] = " ";
    cartography["visible"] = true;
    cartography["transparency"] = 0;
    cartography["queryable"] = false;
    cartography["queryAct"] = null;
    cartography["queryLay"] = null;
    cartography["createdDate"] = "2018-09-25T12:30:19.000+0000";
    cartography["order"] = 1;
    cartography["minimumScale"] = null;
    cartography["maximumScale"] = null;
    cartography["layers"] = "M_PROV_FONS,M_EURB_250M,M_EDIF_1M_141A,M_BTE50_412A,M_EDIF_1M_611A,M_XHE50_111L,M_BTE50_313L_FFCC";
    cartography["selectable"] = null;
    cartography["selectionLayer"] = null;
    cartography["legendTip"] = null;
    cartography["legendUrl"] = null;
    cartography["editable"] = null;
    cartography["metadataUrl"] = null;
    cartography["themeable"] = null;
    cartography["geometryType"] = null;
    cartography["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245"
        },
        "cartography": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245"
        },
        "availabilities": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245/availabilities"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245/service"
        },
        "selectionService": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245/selectionService"
        },
        "connection": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245/connection"
        }
    };
    cartography.service = service;
    cartography.availabilities = null;
    cartography.selectionService = null;
    cartography.connection = null;

    cartographyGroup.members.push(cartography);

    cartography = new Cartography();
    cartography["name"] = "Base Mapa - imgmapa_et";
    cartography["type"] = null;
    cartography["visible"] = true;
    cartography["transparency"] = 0;
    cartography["queryable"] = false;
    cartography["queryAct"] = null;
    cartography["queryLay"] = null;
    cartography["createdDate"] = "2018-09-25T14:32:04.000+0000";
    cartography["order"] = 2;
    cartography["minimumScale"] = null;
    cartography["maximumScale"] = null;
    cartography["layers"] = "M_MUNIS";
    cartography["selectable"] = null;
    cartography["selectionLayer"] = null;
    cartography["legendTip"] = null;
    cartography["legendUrl"] = null;
    cartography["editable"] = null;
    cartography["metadataUrl"] = null;
    cartography["themeable"] = null;
    cartography["geometryType"] = null;
    cartography["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238"
        },
        "cartography": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238"
        },
        "availabilities": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238/availabilities"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238/service"
        },
        "selectionService": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238/selectionService"
        },
        "connection": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238/connection"
        }
    };
    cartography.service = service;
    cartography.availabilities = null;
    cartography.selectionService = null;
    cartography.connection = null;

    cartographyGroup.members.push(cartography);

    cartographyGroup.roles = null;

    return cartographyGroup;
  }

  getDefaultBackgroundsConfiguration() {
    var applicationBackgrounds = new Array<ApplicationBackground>();

    var applicationBackground = new ApplicationBackground();
    applicationBackground["order"] = 1;
    applicationBackground["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/application-backgrounds/226"
        },
        "applicationBackground": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/application-backgrounds/226"
        },
        "background": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/application-backgrounds/226/background"
        },
        "application": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/application-backgrounds/226/application"
        }
    };

    var background = new Background();
    background["name"] = "Mapa";
    background["description"] = "Fondo 1 (mapa) para la app territorial";
    background["active"] = true;
    background["createdDate"] = "2018-09-19T07:13:59.000+0000";
    background["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/backgrounds/212"
        },
        "background": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/backgrounds/212"
        },
        "cartographyGroup": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/backgrounds/212/cartographyGroup"
        }
    };

    var cartographyGroup = new CartographyGroup();

    cartographyGroup["name"] = "Grupo 1. Fondo Mapa App territorial";
    cartographyGroup["type"] = "Fondo";
    cartographyGroup["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartography-groups/210"
        },
        "cartographyGroup": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartography-groups/210"
        },
        "members": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartography-groups/210/members"
        },
        "roles": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartography-groups/210/roles"
        }
    };
    cartographyGroup["members"] = [];

    var cartography = new Cartography();
    
    cartography["name"] = "Base Mapa - imgmapa_et";
    cartography["type"] = null;
    cartography["visible"] = true;
    cartography["transparency"] = 0;
    cartography["queryable"] = true;
    cartography["queryAct"] = null;
    cartography["queryLay"] = null;
    cartography["createdDate"] = "2018-09-25T14:32:04.000+0000";
    cartography["order"] = 2;
    cartography["minimumScale"] = null;
    cartography["maximumScale"] = null;
    cartography["layers"] = "M_MUNIS";
    cartography["selectable"] = null;
    cartography["selectionLayer"] = null;
    cartography["legendTip"] = null;
    cartography["legendUrl"] = null;
    cartography["editable"] = null;
    cartography["metadataUrl"] = null;
    cartography["themeable"] = null;
    cartography["geometryType"] = null;
    cartography["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238"
        },
        "cartography": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238"
        },
        "availabilities": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238/availabilities"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238/service"
        },
        "selectionService": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238/selectionService"
        },
        "connection": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/238/connection"
        }
    };

    var service = new Service();
    service["name"] = "WMS DIBA Public";
    service["url"] = "http://sitmun.diba.cat/arcgis/services/PUBLIC/GCA_WEB/MapServer/WMSServer";
    service["projections"] = "EPSG:25831";
    service["legend"] = "http://sitmun.diba.cat/arcgis/services/PUBLIC/GCA_WEB/MapServer/WMSServer";
    service["type"] = "WMS";
    service["infoUrl"] = "http://sitmun.diba.cat/arcgis/services/PUBLIC/GCA_WEB/MapServer/WMSServer";
    service["createdDate"] = "2018-09-18T17:14:29.000+0000";
    service["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/235"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/235"
        },
        "layers": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/235/layers"
        },
        "parameters": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/235/parameters"
        },
        "connection": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/235/connection"
        }
    };
    service["layers"] = null;
    service["connection"] = null;
      
    var parameters = [];
    var parameter = new ServiceParameter();
    parameter.name = "version";
    parameter.value = "1.1.0";
    parameter.type = "WMS";
    parameter._links = {
        "self": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/236"
        },
        "serviceParameter": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/236"
        },
        "service": {
          "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/236/service"
        }
      };
    parameters.push(parameter);
    
    parameter = new ServiceParameter();
    parameter.name = "format";
    parameter.value = "png";
    parameter.type = "WMS";
    parameter._links = {
      "self": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/237"
      },
      "serviceParameter": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/237"
      },
      "service": {
        "href": "http://ginebra.internal.geoslab.com:8088/api/service-parameters/237/service"
      }
    };
    parameters.push(parameter);
    service.parameters = parameters;

    var service235 = service;

    cartography = new Cartography();
    cartography["service"] = service;
    cartography["availabilities"] = null;
    cartography["selectionService"] = null;
    cartography["connection"] = null;

    cartographyGroup["members"].push(cartography);

    cartography["name"] = "Base Mapa - imgmapa";
    cartography["type"] = " ";
    cartography["visible"] = true;
    cartography["transparency"] = 0;
    cartography["queryable"] = true;
    cartography["queryAct"] = null;
    cartography["queryLay"] = null;
    cartography["createdDate"] = "2018-09-25T12:30:19.000+0000";
    cartography["order"] = 1;
    cartography["minimumScale"] = null;
    cartography["maximumScale"] = null;
    cartography["layers"] = "M_PROV_FONS,M_EURB_250M,M_EDIF_1M_141A,M_BTE50_412A,M_EDIF_1M_611A,M_XHE50_111L,M_BTE50_313L_FFCC";
    cartography["selectable"] = null;
    cartography["selectionLayer"] = null;
    cartography["legendTip"] = null;
    cartography["legendUrl"] = null;
    cartography["editable"] = null;
    cartography["metadataUrl"] = null;
    cartography["themeable"] = null;
    cartography["geometryType"] = null;
    cartography["_links"] = {
          "self": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245"
          },
          "cartography": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245"
          },
          "availabilities": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245/availabilities"
          },
          "service": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245/service"
          },
          "selectionService": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245/selectionService"
          },
          "connection": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/245/connection"
          }
      };

    cartography["service"] = service;
    cartography["availabilities"] = null;
    cartography["selectionService"] = null;
    cartography["connection"] = null;

    cartographyGroup["members"].push(cartography);

    cartography = new Cartography();
    cartography["name"] = "Base Mapa - imgeix";
    cartography["type"] = null;
    cartography["visible"] = true;
    cartography["transparency"] = 0;
    cartography["queryable"] = true;
    cartography["queryAct"] = null;
    cartography["queryLay"] = null;
    cartography["createdDate"] = "2018-09-25T14:32:25.000+0000";
    cartography["order"] = 3;
    cartography["minimumScale"] = null;
    cartography["maximumScale"] = null;
    cartography["layers"] = "M_EIX_ET,M_EDI_ET,M_MUNIS_ET";
    cartography["selectable"] = null;
    cartography["selectionLayer"] = null;
    cartography["legendTip"] = null;
    cartography["legendUrl"] = null;
    cartography["editable"] = null;
    cartography["metadataUrl"] = null;
    cartography["themeable"] = null;
    cartography["geometryType"] = null;
    cartography["_links"] = {
          "self": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247"
          },
          "cartography": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247"
          },
          "availabilities": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247/availabilities"
          },
          "service": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247/service"
          },
          "selectionService": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247/selectionService"
          },
          "connection": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/247/connection"
          }
      };

    cartography["service"] = service;
    cartography["availabilities"] = null;
    cartography["selectionService"] = null;
    cartography["connection"] = null;

    cartographyGroup["members"].push(cartography);
    cartographyGroup["roles"] = null;

    background["cartographyGroup"] = cartographyGroup;

    applicationBackground["background"] = background;

    applicationBackgrounds.push(applicationBackground);

    applicationBackground = new ApplicationBackground();

    applicationBackground["order"] = 2;
    applicationBackground["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/application-backgrounds/272"
        },
        "applicationBackground": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/application-backgrounds/272"
        },
        "background": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/application-backgrounds/272/background"
        },
        "application": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/application-backgrounds/272/application"
        }
    };

    background = new Background();
    background["name"] = "Aèria";
    background["description"] = "Fondo 2 (aèrial) para la app territorial";
    background["active"] = true;
    background["createdDate"] = "2018-09-19T07:14:14.000+0000";
    background["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/backgrounds/266"
        },
        "background": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/backgrounds/266"
        },
        "cartographyGroup": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/backgrounds/266/cartographyGroup"
        }
    };

    cartographyGroup = new CartographyGroup();
    cartographyGroup["name"] = "Grupo 2. Fondo Aerial App territorial";
    cartographyGroup["type"] = "Fondo";
    cartographyGroup["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartography-groups/258"
        },
        "cartographyGroup": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartography-groups/258"
        },
        "members": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartography-groups/258/members"
        },
        "roles": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartography-groups/258/roles"
        }
    };

    cartographyGroup["members"] = [];

    cartography = new Cartography();
    cartography["name"] = "Base Aerial - imgaeria_fons";
    cartography["type"] = null;
    cartography["visible"] = true;
    cartography["transparency"] = 30;
    cartography["queryable"] = true;
    cartography["queryAct"] = null;
    cartography["queryLay"] = null;
    cartography["createdDate"] = "2018-09-26T11:12:24.000+0000";
    cartography["order"] = 2;
    cartography["minimumScale"] = null;
    cartography["maximumScale"] = null;
    cartography["layers"] = "M_PROV_FONS,M_MUNIS";
    cartography["selectable"] = null;
    cartography["selectionLayer"] = null;
    cartography["legendTip"] = null;
    cartography["legendUrl"] = null;
    cartography["editable"] = null;
    cartography["metadataUrl"] = null;
    cartography["themeable"] = null;
    cartography["geometryType"] = null;
    cartography["_links"] = {
          "self": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/256"
          },
          "cartography": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/256"
          },
          "availabilities": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/256/availabilities"
          },
          "service": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/256/service"
          },
          "selectionService": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/256/selectionService"
          },
          "connection": {
              "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/256/connection"
          }
      };

  service = new Service();
  service["name"] = "WMS DIBA Public translucid";
  service["url"] = "http://sitmun.diba.cat/arcgis/services/PUBLIC/GCA_WEB/MapServer/WMSServer";
  service["projections"] = "EPSG:25831";
  service["legend"] = "http://sitmun.diba.cat/arcgis/services/PUBLIC/GCA_WEB/MapServer/WMSServer";
  service["type"] = "WMS";
  service["infoUrl"] = "http://sitmun.diba.cat/arcgis/services/PUBLIC/GCA_WEB/MapServer/WMSServer";
  service["createdDate"] = "2018-09-26T11:11:23.000+0000";
  service["_links"] = {
      "self": {
          "href": "http://ginebra.internal.geoslab.com:8080/api/services/356"
      },
      "service": {
          "href": "http://ginebra.internal.geoslab.com:8080/api/services/356"
      },
      "layers": {
          "href": "http://ginebra.internal.geoslab.com:8080/api/services/356/layers"
      },
      "parameters": {
          "href": "http://ginebra.internal.geoslab.com:8080/api/services/356/parameters"
      },
      "connection": {
          "href": "http://ginebra.internal.geoslab.com:8080/api/services/356/connection"
      }
  };
  service.parameters = [];

  parameter = new ServiceParameter();
  parameter["name"] = "FORMAT";
  parameter["value"] = "image/png";
  parameter["type"] = "WMS";
  parameter["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/358"
        },
        "serviceParameter": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/358"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/358/service"
        }
    };
  service.parameters.push(parameter);

  parameter = new ServiceParameter();
  parameter["name"] = "VERSION";
  parameter["value"] = "1.1.1";
  parameter["type"] = "WMS";
  parameter["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/357"
        },
        "serviceParameter": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/357"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/357/service"
        }
    };
  service.parameters.push(parameter);

  parameter = new ServiceParameter();
  parameter["name"] = "BGCOLOR";
  parameter["value"] = "0xFEFEFE";
  parameter["type"] = "WMS";
  parameter["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/359"
        },
        "serviceParameter": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/359"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/359/service"
        }
    };

  service.parameters.push(parameter);

  cartography.service = service;
  cartography.availabilities = null;
  cartography.selectionService = null;
  cartography.connection = null;
  cartographyGroup["members"].push(cartography);

  cartography = new Cartography();
  cartography["name"] = "Base Aerial - ICC1";
  cartography["type"] = null;
  cartography["visible"] = true;
  cartography["transparency"] = 0;
  cartography["queryable"] = true;
  cartography["queryAct"] = null;
  cartography["queryLay"] = null;
  cartography["createdDate"] = "2018-09-25T15:10:22.000+0000";
  cartography["order"] = 1;
  cartography["minimumScale"] = null;
  cartography["maximumScale"] = null;
  cartography["layers"] = "orto";
  cartography["selectable"] = null;
  cartography["selectionLayer"] = null;
  cartography["legendTip"] = null;
  cartography["legendUrl"] = null;
  cartography["editable"] = null;
  cartography["metadataUrl"] = null;
  cartography["themeable"] = null;
  cartography["geometryType"] = null;
  cartography["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/252"
        },
        "cartography": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/252"
        },
        "availabilities": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/252/availabilities"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/252/service"
        },
        "selectionService": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/252/selectionService"
        },
        "connection": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/252/connection"
        }
    };

  service = new Service();

  service["name"] = "WMS ICC Tiled";
  service["url"] = "http://mapcache.icc.cat/map/bases/service";
  service["projections"] = "ESPG:25831";
  service["legend"] = "http://mapcache.icc.cat/map/bases/service";
  service["type"] = "WMS";
  service["infoUrl"] = "http://mapcache.icc.cat/map/bases/service";
  service["createdDate"] = "2018-09-25T15:17:24.000+0000";
  service["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/301"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/301"
        },
        "layers": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/301/layers"
        },
        "parameters": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/301/parameters"
        },
        "connection": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/services/301/connection"
        }
    };

  service["parameters"] = [];

  parameter = new ServiceParameter();

  parameter["name"] = "BGCOLOR";
  parameter["value"] = "0x000000";
  parameter["type"] = "WMS";
  parameter["_links"] = {
      "self": {
          "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/302"
        },
        "serviceParameter": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/302"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/302/service"
        }
    };
  service["parameters"].push(parameter);

  parameter = new ServiceParameter();
  parameter["name"] = "FORMAT";
  parameter["value"] = "image/png";
  parameter["type"] = "WMS";
  parameter["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/304"
        },
        "serviceParameter": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/304"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/304/service"
        }
    };
    service["parameters"].push(parameter);

  parameter = new ServiceParameter();
  parameter["name"] = "TILESIZE";
  parameter["value"] = "256";
  parameter["type"] = "WMS";
  parameter["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/353"
        },
        "serviceParameter": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/353"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/353/service"
        }
    };
  service["parameters"].push(parameter);

  parameter = new ServiceParameter();
  parameter["name"] = "VERSION";
  parameter["value"] = "1.1.1";
  parameter["type"] = "WMS";
  parameter["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/305"
        },
        "serviceParameter": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/305"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/305/service"
        }
    };
  service["parameters"].push(parameter);

  parameter = new ServiceParameter();
  parameter["name"] = "EXTENT";
  parameter["value"] = "[254904.96, 4484796.89, 530907.3, 4749795.1]";
  parameter["type"] = "WMS";
  parameter["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/307"
        },
        "serviceParameter": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/307"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/307/service"
        }
    };
  service["parameters"].push(parameter);

  parameter = new ServiceParameter();
  parameter["name"] = "TRANSPARENT";
  parameter["value"] = "TRUE";
  parameter["type"] = "WMS";
  parameter["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/303"
        },
        "serviceParameter": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/303"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/303/service"
        }
    };
  service["parameters"].push(parameter);

  parameter = new ServiceParameter();
  parameter["name"] = "TILED";
  parameter["value"] = "TRUE";
  parameter["type"] = "WMS";
  parameter["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/306"
        },
        "serviceParameter": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/306"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/service-parameters/306/service"
        }
    };
  service["parameters"].push(parameter);

  cartography.service = service;
  cartography.availabilities = null;
  cartography.selectionService = null;
  cartography.connection = null;
      
  cartographyGroup["members"].push(cartography);
  
  cartography = new Cartography();
  cartography["name"] = "Base Aerial - imgeix";
  cartography["type"] = null;
  cartography["visible"] = true;
  cartography["transparency"] = 0;
  cartography["queryable"] = true;
  cartography["queryAct"] = null;
  cartography["queryLay"] = null;
  cartography["createdDate"] = "2018-09-25T12:32:51.000+0000";
  cartography["order"] = 3;
  cartography["minimumScale"] = null;
  cartography["maximumScale"] = null;
  cartography["layers"] = "M_EIX_ET,M_EDI_ET,M_MUNIS_ET";
  cartography["selectable"] = null;
  cartography["selectionLayer"] = null;
  cartography["legendTip"] = null;
  cartography["legendUrl"] = null;
  cartography["editable"] = null;
  cartography["metadataUrl"] = null;
  cartography["themeable"] = null;
  cartography["geometryType"] = null;
  cartography["_links"] = {
        "self": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/281"
        },
        "cartography": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/281"
        },
        "availabilities": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/281/availabilities"
        },
        "service": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/281/service"
        },
        "selectionService": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/281/selectionService"
        },
        "connection": {
            "href": "http://ginebra.internal.geoslab.com:8080/api/cartographies/281/connection"
        }
    }

    cartography.service = service235;
    cartography.availabilities = null;
    cartography.selectionService = null;
    cartography.connection = null;
    cartographyGroup["members"].push(cartography);

    cartographyGroup["roles"] = null;

    background["cartographyGroup"] = cartographyGroup;

    applicationBackground["background"] = background;

    applicationBackgrounds.push(applicationBackground);

    return applicationBackgrounds;
  }

  getDefaultApplicationConfiguration() {
    var options = {};
    options["scales"] = [
      1000000,
      700000,
      ​500000,
      400000,
      300000,
      200000,
      100000,
      50000,
      25000,
      20000,
      10000,
      5001,
      2500,
      1000,
      500
    ].join(",");

    options["projections"] = ["EPSG:25831"].join(",");
    options["parameters"] = [];
    var parameter = new ApplicationParameter();
    parameter.name = "minScale";
    parameter.value = "3000";
    options["parameters"].push(parameter);

    parameter = new ApplicationParameter();
    parameter.name = "maxScale";
    parameter.value = "3000000";
    options["parameters"].push(parameter);

    parameter = new ApplicationParameter();
    parameter.name = "maxExtent";
    parameter.value = "[" + [
      320000, //xMin
      4561229,//yMin
      491617, //xMax
      4686464 //yMax
    ].join() + "]";
    options["parameters"].push(parameter);
    
    parameter = new ApplicationParameter();
    parameter.name = "tileWidth";
    parameter.value = "256";
    options["parameters"].push(parameter);
    
    parameter = new ApplicationParameter();
    parameter.name = "tileHeight";
    parameter.value = "256";
    options["parameters"].push(parameter);

    return options;
  }

  //FIXME receive the default configuration from the api
  //Sets whether the map should load the default base layer configuration
  loadMapComponentDefaults:boolean = false;
  //Public values (to be loaded if the user is not logged in)
  loadDefaultApplicationConfiguration() {
    
    this.updateApplicationConfiguration(this.getDefaultApplicationConfiguration());
    this.updateTreesConfiguration(this.getDefaultTreesConfiguration());

    //Load default situation map configuration clone of currently visible baselayer group 
    //this.treeSituationMapConfiguration = null;
    this.updateSituationMapConfiguration(this.getDefaultSituationMapConfiguration());
    //Load default cartography configuration values harcoded in the map component
    this.loadMapComponentDefaults = true;
    //Test values (only 2 groups)
    //this.updateApplicationBackgroundsConfiguration(this.getDefaultBackgroundsConfiguration());
  }

}
