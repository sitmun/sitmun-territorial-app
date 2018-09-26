//goog.provide('ga_catalogtree_controller');

//(function() {

  //export const ga_catalogtree_controller = 'ga_catalogtree_controller';

  //import {gaGlobalOptions} from './GaModule';
  //import {ga_layers_service} from '../components/map/LayersService';
  //import {ga_translation_service} from '../components/translation/TranslationService';

  var module = angular.module('ga_catalogtree_controller', ['ga_layers_service', 'ga_translation_service']);

  module.controller('GaCatalogtreeController', ['$rootScope', '$scope', '$http', 'gaLayers', 'gaLang', 'gaGlobalOptions',
    function($rootScope, $scope, $http, gaLayers, gaLang, gaGlobalOptions) {
  	//Modificar URL de acceso a catálogo
        var baseUrl = '.';
        if (!$rootScope.options) {
		    $rootScope.options = {};
  		}
		var lang = gaLang.get();
		$rootScope.options.catalogUrlTemplate = gaGlobalOptions.localConfigurationOverwrite?
		  null
		  :baseUrl + '/geoadmin-module/catalog/CatalogServer.{Topic}.' + lang + '.json';

  	}]
  );
//})();
