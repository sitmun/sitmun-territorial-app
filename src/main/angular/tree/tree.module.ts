import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';
import angular from 'angular';
import {AppComponent} from '../app/app.component';
import {treeComponent} from './tree.component';

import {MapComponent, MapConfigurationManagerService, 
        Layer, LayerConfiguration, LayerGroup, OptionalParameter} from 'sitmun-plugin-core';

//Angular js imports
import {GEOADMIN_MODULE_NAME} from '../geoadmin-module/geoadmin-module';

export const treeModule = angular.
  module('treeModule', [GEOADMIN_MODULE_NAME]).
  component(treeComponent.selector, treeComponent).
  directive(AppComponent.ngSelector, downgradeComponent({
    component: AppComponent,
  }));


var module = angular.module(GEOADMIN_MODULE_NAME);

// Tree Component configuration service, it parses the information received from the application
// and loads the trees configuration into the tree component and sends the trees, backgrounds
// and stituation map configuration to the map component
module.factory('mapConfigurationManagerService', downgradeInjectable(MapConfigurationManagerService));
module.controller("GaTreeMapConfigurationController", 
['$rootScope', '$scope', 'mapConfigurationManagerService', 'gaLayers', 'gaTopic', '$attrs', 'geoadminModule',
  function($rootScope, $scope, mapConfigurationManagerService, gaLayers, gaTopic, $attrs, geoadminModule){

    // Translate the Tree Component Layer configuration into a Map Component Layer configuration
    function parseGeoAdminLayer(geoadminLayer) {
      var layer:Layer;
      layer = new Layer();

      if (geoadminLayer.visibility != undefined) {
        layer.visibility = geoadminLayer.visibility;
      }
      if (geoadminLayer.opacity != undefined) {
        layer.opacity = geoadminLayer.opacity;
      }
      if (geoadminLayer.label != undefined) {
        layer.title = geoadminLayer.label;
      }
      if (geoadminLayer.serverLayerName != undefined) {
        layer.serverName = geoadminLayer.serverLayerName;
      }
      //If no id is defined use serverName
      if (geoadminLayer.id != undefined) {
        layer.id = geoadminLayer.id;
      } else {
        layer.id = layer.serverName;
      }
      if (geoadminLayer.attribution != undefined) {
        layer.attributions = geoadminLayer.attribution;
      }
      if (geoadminLayer.format != undefined) {
        layer.format = geoadminLayer.format;
      }
      if (geoadminLayer.version != undefined) {
        layer.version = geoadminLayer.version;
      }
      if (geoadminLayer.wmsUrl != undefined) {
        layer.url = geoadminLayer.wmsUrl;
      }
      if (geoadminLayer.isBaseLayer != undefined) {
        layer.isBaseLayer = geoadminLayer.isBaseLayer;
      }
      if (geoadminLayer.wmsLayers != undefined) {
        layer.name = geoadminLayer.wmsLayers;
      }
      if (geoadminLayer.singleTile != undefined) {
        layer.tiled = !geoadminLayer.singleTile;
      }
      if (layer.tiled) {
          //If no tile size is defined the default will be used
          if (geoadminLayer.tileSize) {
            layer.tileHeight = geoadminLayer.tileSize;
            layer.tileWidth = geoadminLayer.tileSize;
          }
      }
      if (geoadminLayer.desc != undefined) {
        layer.desc = geoadminLayer.desc;
      }
      if (geoadminLayer.url_transparent != undefined) {
        layer.url_transparent = geoadminLayer.url_transparent;
      }
      if (geoadminLayer.url_exception != undefined) {
        layer.url_exception = geoadminLayer.url_exception;
      }      
      if (geoadminLayer.url_bgcolor != undefined) {
        layer.url_bgcolor = geoadminLayer.url_bgcolor;
      }
      if (geoadminLayer.extent != undefined) {
        layer.extent = geoadminLayer.extent;
      }
      if (geoadminLayer.optionalParameters != undefined) {
          layer.optionalParameters = geoadminLayer.optionalParameters;
      }

      return layer;
    }

    // Translate the app Cartography configuration into a Tree Component Layer configuration
    function parseCartography(cartography, isBackground, topics) {
      var layerConfig = null;
      if (cartography) {
        var parameterList;/*Array<ServiceParameter>*/
        var parameter;/*ServiceParameter*/
        var parameterName:string;
        var optionalParameter: OptionalParameter;

        layerConfig = {};

        layerConfig.serverLayerName = getElementId(cartography);//Retrieve the object's unique id
        layerConfig.background = isBackground;
        layerConfig.isBaseLayer = false;// If true the layer is moved to the bottom of the visible stack
        layerConfig.visible = cartography.visible;
        //Transform to opacity
        layerConfig.opacity = 1;
        if ((cartography.transparency != undefined) && (cartography.transparency != null)) {
            layerConfig.opacity = Math.abs(1 - cartography.transparency/100);
        }
        //cartography.queryable;//Not supported currently
        //cartography.queryAct;//Currently not supported
        //cartography.queryLay;//Currently not supported

        //Order of the layer in its group
        layerConfig.order = cartography.order;

        //cartography.minimumScale;//Currently not supported ?? Units?
        //cartography.maximumScale;//Currently not supported ?? Units?
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
          //Currently not used                      
          //cartography.service.infoUrl;//Currently not supported for GetfeatureInfo requests
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

        //TODO get the values for
        /*
        "label": string,
        "attribution": string,
        "attributionUrl": string,
        "extent": Array<Number>(4),//extent
        "highlightable": bool,//se resalta en el arbol
        "chargeable": bool,
        "searchable": bool,
        "timeEnabled": bool,
        "tooltip": bool, //Puede mostrar tooltips??
        "topics": string,//ids de topics a los que pertenece
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
            layerConfig.attribution = geoadminModule.getDefaultAttribution();//"";
        }
        if (!layerConfig.attributionUrl) {
            layerConfig.attributionUrl = "";
        }

        //TODO FIXME Mandatory set an extent in case of a WMTS layer
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
        //cartography.metadataUrl;//Currently not supported
        //cartography.themeable;//Currently not supported
        //cartography.geometryType;//Currently not supported
        
        //TODO FIXME use a better way to disable metadata requests on the tree
        layerConfig.metadataInfoDisabled = true;//Disable the display of the metadata info retrieval button in the tree for this layer

        //Check if the layer configuration is correct
        if (!checkLayerConfig(layerConfig)) {
          return null;
        }
      }
      return layerConfig;
    }

    //Checks if the layer configuration complies with the format restrictions, 
    //having the minimum mandatory attributes defined 
    function checkLayerConfig(layerConfig) {
      if (!layerConfig.wmsUrl || !layerConfig.wmsLayers) {
        return false;
      }
      if (((layerConfig.type == "wmts") || !layerConfig.singleTile) && !layerConfig.extent) {
        return false;
      }
      return true;
    }

    //Inserts an object into an array in the position defined by its order property (should it be defined)
    function insertInOrder(elements, element) {
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

    //Inserts an object into an array in the position defined by the order parameter (should it be defined)
    //and updates an elements position array
    function insertByOrder(elements, elementsOrder, element, order) {
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

    //Recursive function to translate the app TreeNode information into a TreeModule node configuration
    function treeNodeParserRec(node, treeId, level, categoryNodes, layersConfiguration, activatedLayerNames) {
      if (!node) {
        return;
      }
      var nodeName = "";
      if (node.parent) {
        treeNodeParserRec(node.parent, treeId, level+1, categoryNodes, layersConfiguration, activatedLayerNames);
      }
      var categoryNode = null;
      var elementId = getElementId(node);
      if (level == 0) {
        //Create the node hierarchy
        var layerConfig = parseCartography(node.cartography, false, treeId);
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
            "order": node.ordee,
            "category": "layer",
            "staging": "prod",
            "label": label,
            "layerBodId": layerConfig.serverLayerName,
            "id": uniqueId++
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
            "order": node.ordee,
            "category": "topic",
            "staging": "prod",
            "selectedOpen": node.active,
            "children": [],
            "label": label,
            "id": uniqueId++
          };
          categoryNodes[elementId] = categoryNode;
        }
      }
      //Add to hierarchy
      if (categoryNode) {
        if (node.parent != null) {
          var parentId = getElementId(node.parent);
          if (categoryNodes[parentId]) {
            //Insert in the defined position
            insertInOrder(categoryNodes[parentId].children, categoryNode);
          }
        } else {
          if (categoryNodes["root"]) {
            //Insert in the defined position
            insertInOrder(categoryNodes["root"].children, categoryNode);
          }
        }
      }
    }

    //Retrieve the element's database unique id from the api rest link request stored as a class property
    function getElementId(element) {
      var id = "";
      if (element && element._links && element._links.self && element._links.self.href) {
        id = element._links.self.href;
        id = id.substring(id.lastIndexOf("/")+1);
      }
      return id;
    }
    
    //Unique topic id
    var uniqueId = 1;

    //Translate application information into Tree Component map configuration information
    function applicationParser(application/*:Application*/) {
      if (application) {
        //TODO
        //extent...
      }
      return null;
    }

    //Translate app tree array configuration into Tree Component tree configuration
    function parseTreesConfiguration(trees) {
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
            treeId = getElementId(tree);
            baseLayerName = treeId;
            if (tree.nodes && tree.nodes.length) {
              activatedLayerNames = [];
              catalogNodes = {
                "root": {
                  "category": "root",
                  "staging": "prod",
                  "id": uniqueId++,
                  "children": []
                }
              };

              tempLayersConfiguration = {};
              for (var j = 0, jLen = tree.nodes.length; j < jLen; j++) {
                treeNode = tree.nodes[j];
                layerName = baseLayerName;
                if (treeNode) {
                  //Recursive hierarchy retrieval treeNode.name should be a unique id
                  treeNodeParserRec(treeNode, treeId, 0, catalogNodes, tempLayersConfiguration, 
                                    activatedLayerNames);
                }
              }
              
              if (!angular.equals(tempLayersConfiguration, {})) {   
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
                angular.extend(layersConfiguration, tempLayersConfiguration)
              }
            }
          }
        }
        if (angular.equals(layersConfiguration, {})) {
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

    //Maps the background id into a known base map group id
    function getKnownBackgroundId(id) {
        var knownId = id;
        if (knownId) {
            var knownId = id.toLowerCase();
            if ((knownId.indexOf('hybrid') != -1) || 
                (knownId.indexOf('híbrida') != -1) ||
                (knownId.indexOf('hibrida') != -1)) {
                return 'hybrid';
            } else if ((knownId.indexOf('aerial') != -1) ||
                        (knownId.indexOf('aerea') != -1) ||
                        (knownId.indexOf('aérea') != -1) ||
                        (knownId.indexOf('aèria') != -1)) {
                return 'aerial';
            } else if ((knownId.indexOf('map') != -1) ||
                       (knownId.indexOf('mapa') != -1)) {
                return 'map';
            }
        }
        return knownId;
    }

    function parseBackgroundsConfiguration(backgrounds) {
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
          applicationBackgroundId = getElementId(applicationBackground);
          layerName = applicationBackgroundId;
          if (applicationBackground.background) {
            layerName += (layerName?"-":"") + getElementId(applicationBackground.background);
            //TODO SET THE GROUP VISIBILITY? or SELECT WITH VIEWER CONTROL
            //background.background.active; //Currently not supported
            if (applicationBackground.background.cartographyGroup) {
              baseLayerNames = [];
              baseLayerOrders = [];
              groupId = getElementId(applicationBackground.background.cartographyGroup);
              if (groupId) {
                layerName += (layerName?"-":"") + groupId; //Update the layer id
              }
              //applicationBackground.background.cartographyGroup.type; //Currently not supported
              cartographyList = applicationBackground.background.cartographyGroup.members;
              //Parse the members cartographies
              if (cartographyList && cartographyList.length) {
                for (var j = 0, jLen = cartographyList.length; j < jLen; j++) {
                  //The topic does not matter for this layers, it is defined as all
                  layerConfig = parseCartography(cartographyList[j], true, "all");
                  if (layerConfig) {
                    if (layersConfiguration == null) {
                      layersConfiguration = {};
                    }
                    layerConfig.serverLayerName = 
                      layerName + (layerName?"-":"") + layerConfig.serverLayerName;
                    layersConfiguration[layerConfig.serverLayerName] = layerConfig;
                    //Insert the element in the right order
                    insertByOrder(baseLayerNames, baseLayerOrders, layerConfig.serverLayerName, 
                                  layerConfig.order);
                  }
                }
                if (topicsConfiguration == null) {
                  topicsConfiguration = {};
                  topicsConfiguration.topics = [];
                  topicsConfiguration.baseGroups = [];
                }
                //Insert the element in the right order
                insertInOrder(topicsConfiguration.baseGroups, {
                  order: applicationBackground.order,//Will be ignored by the tree only for 
                                                     //generating the correct structure purposes
                    //TODO FIX CHANGE WHEN A MAP GENERIC BASE LAYER/LAYER GROUP SELECTOR IS DEFINED
                  id: getKnownBackgroundId(applicationBackground.background.name),
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

    //Translate the app situation map configuration into Tree Component/Map component
    function parseSituationMapConfiguration(situationMap) {
      var situationMapLayersConfiguration = null;
      if (situationMap) {
        var cartographyGroup = situationMap;
        var layerName;
        var cartographyList;
        var layerConfig;
        var cartographyGroupId;
        if (cartographyGroup) {
          layerName = "situation-map";
          cartographyGroupId = getElementId(cartographyGroup);
          if (cartographyGroupId) {
            layerName += (layerName?"-":"") + cartographyGroupId; //update the layer id
          }
          //cartographyGroup.type; //Currently not supported
          cartographyList = cartographyGroup.members;
          //Parse the members cartographies
          if (cartographyList && cartographyList.length) {
            for (var j = 0, jLen = cartographyList.length; j < jLen; j++) {
              //The topic does not matter for this layers, it is defined as all
              layerConfig = parseCartography(cartographyList[j], true, "all");
              if (layerConfig) {
                if (situationMapLayersConfiguration == null) {
                  situationMapLayersConfiguration = [];
                }
                layerConfig.serverLayerName = 
                  layerName + (layerName?"-":"") + layerConfig.serverLayerName;
                insertInOrder(situationMapLayersConfiguration, layerConfig);
              }
            }
          }
        }
      }
      return situationMapLayersConfiguration;
    }

    //Loads the new trees configuration 
    $rootScope.loadTreesConfiguration = function(trees) {
        if (trees) {
            if (typeof trees == "string") {
                trees = JSON.parse(trees);
            }
            var configuration = parseTreesConfiguration(trees);
            gaLayers.loadTreeLayersConfiguration(configuration.layersConfiguration)
            .then(function(layers){
                gaTopic.loadTopicsConfiguration(configuration.topicsConfiguration, 
                    configuration.catalogsConfiguration)
            });
        }
    }

    //Loads the new situation map configuration 
    $rootScope.loadSituationMapConfiguration = function(situationMap) {
        if (situationMap) {
            if (typeof situationMap == "string") {
                situationMap = JSON.parse(situationMap);
            }
            var configuration = parseSituationMapConfiguration(situationMap);
            //It has nothing to do with the tree
            setSituationMapConfiguration(configuration);
        }
    }

    //Loads the new backgrounds configuration 
    $rootScope.loadBackgroundsConfiguration = function(backgrounds) {
        if (backgrounds) {
            if (typeof backgrounds == "string") {
                backgrounds = JSON.parse(backgrounds);
            }
            var configuration = parseBackgroundsConfiguration(backgrounds);
            gaLayers.loadBackgroundLayersConfiguration(configuration.layersConfiguration).then(function(layers){
                gaTopic.updateBaseGroupsConfiguration(configuration.topicsConfiguration);
            });
        }
    }

    function setSituationMapConfiguration(configuration) {
        //TODO send the situation map configuration to the map component
    }

    //Loads the new map configuration (¿retrieved from the app Application object?)
    function setMapConfiguration(configuration) {
      //Send to viewer via service the mapConfiguration parameters
      var situationMapLayers = null;
      if (configuration.situationMapLayersConfiguration) {
        setSituationMapConfiguration(configuration.situationMapLayersConfiguration);
      }
      if (configuration.scales) {

      }
      if (configuration.projections) {

      }
      //TODO send configuration to service
    }

    //Listen to topic changes and load the new configuration into the tree component
    $rootScope.$on('gaTopicChange', function(evt, newTopic) {
      var configuration = newTopic;
      var layers = [];
      if (newTopic.activatedLayers) {
        var layer;
        if (newTopic.activatedLayers instanceof String) {
          //Retrieve the active (displayed) layers from the topic information
          layer = gaLayers.getLayer(newTopic.activatedLayers);
          if (layer) {
            layers.push(layer);
          }
        } else {
          if (newTopic.activatedLayers.length) {
            for (var i = 0, iLen = newTopic.activatedLayers.length; i < iLen; i++) {
              //Retrieve the tree component layers configuration
              layer = gaLayers.getLayer(newTopic.activatedLayers[i]);
              if (layer) {
                //Translate the tree component layers configuration into a map component configuration
                layer = parseGeoAdminLayer(layer);
                //FIXME define the visibility as true??
                //layer.visibility = true;
                layers.push(layer);
              }
            }
          }
        }
      }
      //Send the new layers configuration to the map (will clear any prior configuration)
      mapConfigurationManagerService.loadLayersConfiguration(layers);
    });

    //Listen to base layer configurations changes and sends the new configuration to the Map component
    $rootScope.$on('gaBaselayersGroupConfiguration', function(event, configuration) {
      var baseLayerConfiguration = new Array<LayerGroup>();
      var group;
      var config;
      var layers;
      for (var i = 0, iLen = configuration.length; i < iLen; i++) {
        group = new LayerGroup();
        config = configuration[i];
        group.id = config.id;
        group.layers = new Array<Layer>();
        var layer;
        if (config.layers && config.layers.length) {
          for (var j = 0, jLen = config.layers.length; j < jLen; j++) {
            layer = config.layers[j];
            if (layer) {
                //Retrieve the tree component layers configuration
              layer = gaLayers.getLayer(layer);
              if (layer) {
                //Translate the tree component layers configuration into a map component configuration
                group.layers.push(parseGeoAdminLayer(layer));
              }
            }
          }
        }
        baseLayerConfiguration.push(group);
      }
      //Send the new base layers configuration to the map (will clear any prior configuration)
      mapConfigurationManagerService.loadBaseLayersConfiguration(baseLayerConfiguration);
    });

    //Listen to node/layer display changes and send it to the Map component
    $rootScope.$on('gaDisplayedAdded', function(event, params) {
      var layer = params[0];
      var visibility = params[1];
      if (layer) {
        var properties = layer.getProperties();
        if (properties && properties.bodId) {
          layer = gaLayers.getLayer(properties.bodId);
          if (layer) {
            //Retrieve the tree component layer configuration
            layer = parseGeoAdminLayer(layer);
            layer.visibility = visibility;
            //Translate the tree component layer configuration into a map component configuration
            // and send it to the map component to add the layer to the map's displayed layer stack
            mapConfigurationManagerService.addLayer(layer);
          }
        }
      }
    });

    //TODO FIXME there is a bug, in the tree catalog section node, it always refers to the first duplicated
    //node in the tree displayed section
    $rootScope.$on('gaDisplayedDuplicated', function(event, params) {
      var layer = params[0];
      var index = params[1];
      if (layer) {
        var properties = layer.getProperties();
        if (properties && properties.bodId) {
          layer = gaLayers.getLayer(properties.bodId);
          if (layer) {
            //modify the layer.id/layer.serverName in order to make it unique to be able 
            //to modify/remove the corresponding layer from the map
            layer = parseGeoAdminLayer(layer);
            var mapLayer = params[0];
            layer.visibility = mapLayer.visible;
            var timestamp = new Date().getTime();
            var id = layer.id + timestamp;
            var serverName = layer.serverName + "-" + timestamp;
            layer.id = id;
            layer.serverName = serverName;
            //set a property to identify the layer as a duplicate
            mapLayer.setProperties({
                duplicateId: id,
                duplicateServerName: serverName
              });
            mapConfigurationManagerService.addLayerAt(layer, index);
          }
        }
      }
    });

    //Detect displayed layers removals from the Tree component and send them to the Map component
    $rootScope.$on('gaDisplayedRemoved', function(event, layer) {
      if (layer) {
        var properties = layer.getProperties();
        if (properties && properties.bodId) {
          var id = properties.bodId;
          if (properties.duplicateId) {
            id = properties.duplicateId;            
          } else {
            id = properties.bodId;
          }
          //Notify the layer removal to the Map component
          mapConfigurationManagerService.removeLayerId(id);
        }
      }
    });

    //Detect displayed layes movements from the Tree component and send them to the Map component
    $rootScope.$on('gaDisplayedMoved', function(event, params) {
      var layer = params[0];
      var index = params[1];
      if (layer) {
        var properties = layer.getProperties();
        if (properties && properties.bodId) {
          var id;
          if (properties.duplicateId) {
            id = properties.duplicateId;
          } else {
            id = properties.bodId;
          }
          //Notify the layer's new position to the Map component
          mapConfigurationManagerService.moveLayer(id, index);
        }
      }
    });

    //Detect layer visibility changes from the Tree component and send them to the Map component
    $rootScope.$on('gaDisplayedVisibilityChanged', function(event, params) {
      var layer = params[0];
      var visibility = params[1];

      if (layer) {
        var properties = layer.getProperties();
        if (properties && properties.bodId) {
          var id;
          if (properties.duplicateId) {
            id = properties.duplicateId;
          } else {
            id = properties.bodId;
          }
          //Notify the layer's visibility to the Map component
          mapConfigurationManagerService.changeLayerVisibility(id, visibility);
        }
      }
    });

    //Detect layer opacity changes from the Tree component and send them to the Map component
    $rootScope.$on('gaDisplayedOpacityChanged', function(event, params) {
      var layer = params[0];
      var opacity = params[1];
      if (layer) {
        var properties = layer.getProperties();
        if (properties && properties.bodId) {
          var id;
          if (properties.duplicateId) {
            id = properties.duplicateId;
          } else {
            id = properties.bodId;
          }
          //Notify the layer's opacity to the Map component
         mapConfigurationManagerService.changeLayerOpacity(id, opacity);
        }
      }
    });

    //Listen to the directive's tree configuration attribute changes and loads the new configuration 
    $rootScope.$on('gaTreeConfigurationChanged', function(event, params) {
      if (params) {
        $rootScope.loadTreesConfiguration(params);
      }
    });

    //Listen to the directive's situation map configuration attribute changes and loads the new configuration 
    $rootScope.$on('gaSituationMapConfigurationChanged', function(event, params) {
      if (params) {
        $rootScope.loadSituationMapConfiguration(params);
      }
    });

    //Listen to the directive's backgrounds configuration attribute changes and loads the new configuration 
    $rootScope.$on('gaBackgroundsConfigurationChanged', function(event, params) {
      if (params) {
        $rootScope.loadBackgroundsConfiguration(params);
      }
    });

    //TODO Listener for the directive application parameter changes (Territory, extetnds, scales, projections...)
}]);

