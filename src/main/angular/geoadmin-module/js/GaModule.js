//goog.provide('geoadmin');

//goog.require('ga_attribution');
//goog.require('ga_catalogtree');
//goog.require('ga_catalogtree_controller');
//goog.require('ga_collapsible_directive');
//goog.require('ga_draggable_directive');
//goog.require('ga_help');
//goog.require('ga_height_service');
//goog.require('ga_layermanager');
//goog.require('ga_main_controller');
//goog.require('ga_modal_directive');
//goog.require('ga_popup');
//goog.require('ga_stylesfromliterals_service');
//goog.require('ga_swipe');
//goog.require('ga_tabs');
//goog.require('ga_timeselector');
//goog.require('ga_timeselector_controller');
//goog.require('ga_topic');
//goog.require('ga_translation');
//goog.require('ga_translation_controller');
//goog.require('ga_waitcursor_service');
//(function() {

  //import {ga_attribution} from '../components/attribution/AttributionModule';
  //import {ga_catalogtree} from '../components/catalogtree/CatalogtreeModule';
  //import {ga_help} from '../components/help/HelpModule';
  //import {ga_popup} from '../components/popup/PopupModule';
  //import {ga_topic} from '../components/topic/TopicModule';
  //import {ga_timeselector} from '../components/timeselector/TimeSelectorModule';
  //import {ga_translation} from '../components/translation/TranslationModule';
  //import {ga_layermanager} from '../components/layermanager/LayermanagerModule';
  //import {ga_swipe} from '../components/swipe/SwipeModule';
  //import {ga_waitcursor_service} from '../components/WaitCursorService';
  //import {ga_stylesfromliterals_service} from '../components/StylesFromLiteralsService';
  //import {ga_tabs} from '../components/tabs/TabsModule';
  //import {ga_modal_directive} from '../components/ModalDirective';
  //import {ga_draggable_directive} from '../components/DraggableDirective';
  //import {ga_collapsible_directive} from '../components/CollapsibleDirective';
  //import {ga_slider_directive} from '../components/slider/SliderDirective';
  //import {ga_height_service} from '../components/HeightService';
  //import {ga_main_controller} from './MainController';
  //import {ga_catalogtree_controller} from './CatalogtreeController';
  //import {ga_translation_controller} from './TranslationController';
  //import {ga_timeselector_controller} from './TimeSelectorController';

  //export const geoadmin = 'geoadmin';

  var module = angular.module('geoadmin', [
    'ga_attribution',
    'ga_catalogtree',
    'ga_help',
    'ga_popup',
    'ga_topic',
    'ga_timeselector',
    'ga_translation',
    'ga_layermanager',
    'ga_swipe',
    'ga_waitcursor_service',
    'ga_stylesfromliterals_service',
    'ga_tabs',
    'ga_modal_directive',
    'ga_draggable_directive',
    'ga_collapsible_directive',
    'ga_slider_directive',
    'ga_height_service',
    'ga_main_controller',
    'ga_catalogtree_controller',
    'ga_translation_controller',
    'ga_timeselector_controller',
    'ga_translation_service'
  ]);

  module.config(function($translateProvider, $provide, gaGlobalOptions) {
    $translateProvider.useStaticFilesLoader({
      prefix: gaGlobalOptions.resourceUrl + 'locales/',
      suffix: '.json'
    });

	//Provide translator to add non-translable values dynamically from the tree or catalog data loaded
    $translateProvider.preferredLanguage(gaGlobalOptions.translationFallbackCode);
    $translateProvider.forceAsyncReload(true);
    $translateProvider.cloakClassName('ng-cloak');
    // TODO: Use $sanitize instead in the future
    // see http://angular-translate.github.io/docs/#/guide/19_security
    $translateProvider.useSanitizeValueStrategy(null);

    $provide.value('$translateProvider', $translateProvider);
  });

  module.config(function(gaLayersProvider, gaGlobalOptions) {

    var dflt = ['0', '1', '2', '3', '4'];
    var hundred = ['100', '101', '102', '103', '104'];

    // Domains
    gaLayersProvider.wmsSubdomains = dflt;
    gaLayersProvider.wmtsSubdomains = hundred;
    gaLayersProvider.vectorTilesSubdomains =
        gaGlobalOptions.staging === 'prod' ? dflt : dflt;

    // Map services urls
    gaLayersProvider.wmsUrl = gaGlobalOptions.wmsUrl;
    gaLayersProvider.wmtsUrl = gaGlobalOptions.wmtsUrl +
        '/1.0.0/{Layer}/default/{Time}/{TileMatrixSet}/{z}/{x}/{y}.{Format}';
    gaLayersProvider.wmtsLV03Url = gaGlobalOptions.wmtsUrl +
        '/1.0.0/{Layer}/default/{Time}/{TileMatrixSet}/{z}/{y}/{x}.{Format}';
    gaLayersProvider.terrainUrl = gaGlobalOptions.terrainUrl +
        '/1.0.0/{Layer}/default/{Time}/4326';
    gaLayersProvider.vectorTilesUrl = gaGlobalOptions.vectorTilesUrl +
        '/{Layer}/{Time}/';

    // Api services urls
    if (gaGlobalOptions.localConfigurationOverwrite) {
      //Ignore layers configuration requests, get the configuration from the module directive attributes
      gaLayersProvider.layersConfigUrl = null;
    } else {
      if (gaGlobalOptions.apiOverwrite) {
        gaLayersProvider.layersConfigUrl = gaGlobalOptions.apiUrl +
            '/rest/services/all/MapServer/layersConfig?lang={Lang}';
      } else {
        gaLayersProvider.layersConfigUrl = gaGlobalOptions.resourceUrl +
            'layersConfig.{Lang}.json';
      }
    }
    gaLayersProvider.legendUrl = gaGlobalOptions.apiUrl +
        '/rest/services/all/MapServer/{Layer}/legend?lang={Lang}';
  });

  module.config(function(gaTopicProvider, gaGlobalOptions) {
    if (gaGlobalOptions.localConfigurationOverwrite) {
      //Ignore topics url requests, get the configuration from the module directive attributes
      gaTopicProvider.topicsUrl = null;
    } else {
      if (gaGlobalOptions.apiOverwrite) {
        gaTopicProvider.topicsUrl = gaGlobalOptions.apiUrl + '/rest/services';
      } else {
        gaTopicProvider.topicsUrl = gaGlobalOptions.resourceUrl + 'services';
      }
    }
  });

  module.config(function(gaUrlUtilsProvider, gaGlobalOptions) {
    gaUrlUtilsProvider.shortenUrl = gaGlobalOptions.apiUrl +
        '/shorten.json';
  });

  module.config(function($sceDelegateProvider, gaGlobalOptions) {
    var whitelist = $sceDelegateProvider.resourceUrlWhitelist();
    whitelist = whitelist.concat(gaGlobalOptions.whitelist);
    $sceDelegateProvider.resourceUrlWhitelist(whitelist);
  });

  module.config(function($compileProvider, gaGlobalOptions) {
    $compileProvider.aHrefSanitizationWhitelist(gaGlobalOptions.hrefRegexp);
  });

  //Define a module provider to notify the parent app changes
  module.provider('geoAdmin', function() {
    this.$get = function(gaLang, gaGlobalOptions) {
      var GeoAdmin = function() {
		    //Notify the parent language changes
        this.changeLanguage = function(language) {
          gaLang.set(language);
        }

        this.reloadLanguage = function() {
          gaLang.reload();
        }

		    //Set and get a default attribution value to send to the map component
        this.setDefaultAttribution = function(value) {
          gaGlobalOptions.defaultAttribution = value;
        }
        this.getDefaultAttribution = function() {
          return gaGlobalOptions.defaultAttribution;
        }
      };
      return new GeoAdmin();
    }    
  });

  // Update the translation values dynamically upon catalog and tree loading or selection
  module.provider('translatorUpdater', function() {
    this.$get = function($translateProvider, $translate, gTranslationIndependentValues) {
      var TranslatorUpdater = function() {
        this.addValue = function(name, value) {
          $translateProvider.translations(
            $translate.use(), {name: value});
        }
        this.addValues = function(values) {
          $translateProvider.translations(
            $translate.use(), values);
        }
        this.refresh = function() {
          $translate.refresh();
        }
        this.reload = function() {
          if (!angular.equals(gTranslationIndependentValues, {})) {
            this.addValues(gTranslationIndependentValues);
          }
        }
      };
      return new TranslatorUpdater();
    }    
  });

//})();
