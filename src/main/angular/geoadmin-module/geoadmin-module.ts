import * as angular from 'angular';
import * as angularTranslate from 'angular-translate';
import * as angularTranslateLoaderStaticFiles from 'angular-translate-loader-static-files';

//TODO FIXME remove ol references from the module
import * as OpenLayers from 'openlayers';
var ol = OpenLayers;
import './lib/olLib/ol.js';

//Import nmodule dependencies
import './geoadmin-dependencies';
import './js/GaModule';

//Define module name (for angular upgrade)
export const GEOADMIN_MODULE_NAME = 'geoadminmodule';  

//Define angularjs tree module directive
var module = angular.module(GEOADMIN_MODULE_NAME, ['geoadmin']);
module.directive('geoadminModule', function($rootScope, geoadminModule) {
    return {
        templateUrl: './geoadmin-module.html',
        link: function(scope, element, attrs) {
          scope.$watch(function() {
                        return attrs.extent;
                      }, function(val){
                        if (val) {
                          //TODO sent extent change to the map component
                        }
                      });
          scope.$watch(function() {
                        return attrs.treeConfiguration;
                      }, function(val){
                        if (val) {
                          //send tree configuration change
                          $rootScope.$broadcast("gaTreeConfigurationChanged", val);
                        }
                      });
          scope.$watch(function() {
                        return attrs.situationMapConfiguration;
                      }, function(val){
                        if (val) {
                          //send situation map configuration change
                          $rootScope.$broadcast("gaSituationMapConfigurationChanged", val);
                        }
                      });
          scope.$watch(function() {
                        return attrs.backgroundsConfiguration;
                      }, function(val){
                        if (val) {
                          //send backgrounds configuration change
                          $rootScope.$broadcast("gaBackgroundsConfigurationChanged", val);
                        }
                      });
          scope.$watch(function() {
                        return attrs.applicationConfiguration;
                      }, function(val){
                        if (val) {
                          //send backgrounds configuration change
                          $rootScope.$broadcast("gaApplicationConfigurationChanged", val);
                        }
                      });
          scope.$watch(function() {
                        return attrs.languageConfiguration;
                      }, function(val){
                        if (val) {
                          //send language configuration
                          geoadminModule.changeLanguage(val);
                        }
                      });
          scope.$watch(function() {
                        return attrs.defaultAttribution;
                      }, function(val){
                        if (val) {
                          //send language configuration
                          geoadminModule.setDefaultAttribution(val);
                        }
                      });
        }
    }
});

//Define angularjs tree module provider
module.provider('geoadminModule', function() {
  this.$get = function(geoAdmin) {
    var GeoAdminModule = function() {
      this.changeLanguage = function(language) {
        //force language change (sent from the angular parent app)
        geoAdmin.changeLanguage(language);
      }
      this.reloadLanguage = function() {
        geoAdmin.reloadLanguage();
      }
      this.setDefaultAttribution = function(value) {
        geoAdmin.setDefaultAttribution(value);
      }
      this.getDefaultAttribution = function() {
        return geoAdmin.getDefaultAttribution();
      }
    };
    return new GeoAdminModule();
  }
});