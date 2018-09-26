//goog.provide('ga_main_controller');

//goog.require('ga_layers_service');
//goog.require('ga_maputils_service');
//goog.require('ga_networkstatus_service');
//goog.require('ga_topic_service');
//goog.require('ga_translation_service');
//goog.require('ga_window_service');

//(function() {

  //import * as angularTranslate from 'angular-translate';

  //import {ga_networkstatus_service} from '../components/NetworkStatusService';
  //import {ga_topic_service} from '../components/topic/TopicService';
  //import {ga_window_service} from '../components/WindowService';
  //import {ga_translation_service} from '../components/translation/TranslationService';

  //import gaGlobalOptions from './GaModule';

  //export const ga_main_controller = 'ga_main_controller';
  //Openlayers imports
  //import * as ol from 'openlayers';
  //var $ = require('jquery');

  var module = angular.module('ga_main_controller', [
    'pascalprecht.translate',
    'ga_networkstatus_service',
    'ga_topic_service',
    'ga_window_service',
    'ga_translation_service',
    'ga_maputils_service',
    'ga_permalinklayers_service'
  ]);

  /**
   * The application's main controller.
   */
  module.controller('GaMainController', function($rootScope, $scope, $timeout,
      $translate, $window, $document, $q, gaBrowserSniffer, gaHistory, $compile,
      gaPermalinkLayersManager, gaMapUtils,
      gaNetworkStatus, gaPermalink, gaStorage,
      gaGlobalOptions, gaTime, gaLayers, gaTopic,
      gaWindow, gaLang) {

    var createMap = function() {
      var toolbar = $('#zoomButtons')[0];
      var defaultProjection = ol.proj.get(gaGlobalOptions.defaultEpsg);

      if (defaultProjection && !defaultProjection.getExtent()) {
        defaultProjection.setExtent(gaGlobalOptions.defaultEpsgExtent);
      }

      //TODO FIXME 
	  // Map object definition to avoid having to create an OpenLayers map object
	  //to handle the layer management
      var map = {
        defaultProjection: defaultProjection, 
        layers: [],
        getLayers: function() {
          return {
            on: function() {

            },
            getLength: function() {
              return $scope.map.layers.length;
            },
            getArray: function() {
              return $scope.map.layers;
            },
            item: function(index) {
              return $scope.map.layers[index];
            },
            removeAt: function(index) {
              var layers = $scope.map.layers;
              layers[index] = null;
              for (var i = index; i < layers.length-1; i++) {
                layers[i] = layers[i+1];
              }
              layers.pop();
            },
            insertAt: function(index, layer) {
              var layers = $scope.map.layers;
              layers[layers.length] = null;
              for (var i = layers.length-1; i > index; i--) {
                layers[i] = layers[i-1];
              }
              layers[index] = layer;
            },
            forEach: function(f) {
              var layers = $scope.map.layers;
              for (var i = 0, iLen = layers.length; i < iLen; i++) {
                f.call(this, layers[i], i, layers);
              }
            }
          }
        },
        addLayer: function(layer) {
          $scope.map.layers[$scope.map.layers.length] = layer;
        },
        removeLayer: function(layer) {
          var found  = -1;
          var l;
          var layers = $scope.map.layers;
          for (var i = 0, iLen = layers.length; i < iLen; i++) {
            l = layers[i];
            if (l == layer) {
              found = i;
              break;
            }
          }
          if (found != -1) {
            for (var c = found, len = layers.length-1; c < len; c++) {
              layers[c] = layers[c+1];
            }
            layers.pop();
          }
        },
        getView: function() {
          return {
            getProjection: function() {
              return $scope.map.defaultProjection;
            },
            getPixelFromCoordinate: function(coorduinate) {
              return [0,0];
            },
            getCoordinateFromPixel: function(pixel) {
              return {
                x: 0, 
                y: 0,
                getX: function() {
                  return 0;
                },
                getY: function() {
                  return 0;
                }
              };
            }
          }
        }
      };

      return map;
    };

    // Determines if the window has a height <= 550
    var win = $($window);

    // The main controller creates the OpenLayers map object. The map object
    // is central, as most directives/components need a reference to it.
    $scope.map = createMap();

    // Start managing global time parameter, when all permalink layers are
    // added.
    gaTime.init($scope.map);

    // Activate the "layers" parameter permalink manager for the map.
    gaPermalinkLayersManager($scope.map);

    var initWithPrint = /print/g.test(gaPermalink.getParams().widgets);
    var initWithFeedback = /feedback/g.test(gaPermalink.getParams().widgets);
    var initWithDraw = /draw/g.test(gaPermalink.getParams().widgets) ||
        !!(gaPermalink.getParams().adminId);
    gaPermalink.deleteParam('widgets');

    var onTopicsLoaded = function() {
      if (gaPermalink.getParams().layers !== undefined) {
        $scope.globals.catalogShown = false;
        $scope.globals.selectionShown = true;
      } else {
        $scope.globals.catalogShown = true;
        $scope.globals.selectionShown = false;
      }
    };

    var onTopicChange = function(event, topic) {
      $scope.topicId = topic.id;

      // iOS 7 minimal-ui meta tag bug
      if (gaBrowserSniffer.ios) {
        $window.scrollTo(0, 0);
      }

      if (topic.activatedLayers.length) {
        $scope.globals.selectionShown = true;
        $scope.globals.catalogShown = false;
      } else if (topic.selectedLayers.length) {
        $scope.globals.catalogShown = true;
        $scope.globals.selectionShown = false;
      } else {
        if (event === null) {
          onTopicsLoaded();
        } else {
          $scope.globals.catalogShown = true;
        }
      }
    };

    
    var onTopicChangeRegistered = false;
    function updateTopicConfiguration() {
      var topicP = gaTopic.loadConfig();
      if (topicP != null) {
        topicP.then(function() {
          $scope.topicId = gaTopic.get().id;

          if (initWithPrint) {
            $scope.globals.isPrintActive = true;
          } else if (initWithFeedback) {
            $scope.globals.feedbackPopupShown = initWithFeedback;
          } else if (initWithDraw) {
            $scope.globals.isDrawActive = initWithDraw;
          } else {
            onTopicChange(null, gaTopic.get());
          }
          if (!onTopicChangeRegistered) {
            $rootScope.$on('gaTopicChange', onTopicChange);
            onTopicChangeRegistered = true;
          }
        });
      }
    }
    updateTopicConfiguration();
	//Listen to topic selection changes to load the corresponding layers
    $rootScope.$on('gaTopicsConfigurationLoaded', updateTopicConfiguration);

    $rootScope.$on('$translateChangeEnd', function() {
      $scope.langId = gaLang.get();
    });

    $scope.time = gaTime.get();
    $rootScope.$on('gaTimeChange', function(event, time) {
      $scope.time = time; // Used in embed page
    });

    // Create switch device url
    var switchToMobile = '' + !gaBrowserSniffer.mobile;
    $scope.host = {url: $window.location.host}; // only use in embed.html
    $scope.toMainHref = gaPermalink.getMainHref();
    $scope.deviceSwitcherHref = gaPermalink.getHref({mobile: switchToMobile});
    $rootScope.$on('gaPermalinkChange', function() {
      $scope.toMainHref = gaPermalink.getMainHref();
      $scope.deviceSwitcherHref = gaPermalink.getHref({mobile: switchToMobile});
    });

    $scope.globals = {
      dev3d: gaGlobalOptions.dev3d,
      pegman: gaGlobalOptions.pegman,
      searchFocused: false,
      homescreen: false,
      webkit: gaBrowserSniffer.webkit,
      ios: gaBrowserSniffer.ios,
      animation: gaBrowserSniffer.animation,
      offline: gaNetworkStatus.offline,
      desktop: gaBrowserSniffer.desktop,
      mobile: gaBrowserSniffer.mobile,
      embed: gaBrowserSniffer.embed,
      pulldownShown: false,
      catalogShown: false,
      selectionShown: false,
      feedbackPopupShown: false,
      settingsShown: false,
      queryShown: false,
      isShareActive: false,
      isDrawActive: false,
      isFeatureTreeActive: false,
      isPrintActive: false,
      isSwipeActive: false,
      is3dActive: false,//3D is not supported currently
      hostIsProd: gaGlobalOptions.hostIsProd
    };

    // Define whether the settings panel should be displayed
    if ($scope.globals.showTreePageSettings == undefined) {
      $scope.globals.showTreePageSettings = true;
    }

    // gaWindow is efficient only after the dom is ready
    $scope.$applyAsync(function() {
      $scope.globals.searchFocused = gaWindow.isWidth('>xs');
      $scope.globals.pulldownShown = gaWindow.isWidth('>s') &&
           gaWindow.isHeight('>s');

      // Update the settings panel visibility variable
      $scope.globals.settingsShown = gaWindow.isWidth('<=m') && 
                                     $scope.globals.showTreePageSettings;
      $scope.globals.queryShown = gaWindow.isWidth('>m');
    });

    $scope.hidePulldownOnXSmallScreen = function() {
      if (gaWindow.isWidth('xs')) {
        $scope.globals.pulldownShown = false;
      }
    };

    // Deactivate all tools when draw is opening
    $scope.$watch('globals.isDrawActive', function(active) {
      if (active) {
        $scope.globals.feedbackPopupShown = false;
        $scope.globals.isFeatureTreeActive = false;
        $scope.globals.isSwipeActive = false;
      }
    });
    // Deactivate all tools when 3d is opening
    $scope.$watch('globals.is3dActive', function(active) {
      if (active) {
        $scope.globals.feedbackPopupShown = false;
        $scope.globals.isFeatureTreeActive = false;
        $scope.globals.isSwipeActive = false;
        $scope.globals.isDrawActive = false;
        $scope.globals.isShareActive = false;
      }
    });
    // Activate share tool when menu is opening.
    $scope.$watch('globals.pulldownShown', function(active) {
      if (active && !$scope.globals.isDrawActive &&
          !$scope.globals.isShareActive && gaWindow.isWidth('xs')) {
        $scope.globals.isShareActive = true;
      }
    });

    $rootScope.$on('gaNetworkStatusChange', function(evt, offline) {
      $scope.globals.offline = offline;
    });

    // Only iOS Safari
    if (!$window.navigator.standalone && gaBrowserSniffer.ios &&
        gaBrowserSniffer.safari && !gaStorage.getItem('homescreen')) {
      $timeout(function() {
        $scope.globals.homescreen = true;
        $scope.globals.tablet = gaWindow.isWidth('s');
        $scope.$watch('globals.homescreen', function(newVal) {
          if (newVal === false) {
            gaStorage.setItem('homescreen', 'none');
          }
        });
      }, 2000);
    }

    // Manage exit of draw mode
    // Exit Draw mode when pressing ESC or Backspace button
    $document.on('keydown', function(evt) {
      if (evt.which === 8) {
        if (!/^(input|textarea)$/i.test(evt.target.tagName)) {
          evt.preventDefault();
        } else {
          return;
        }
      }
      if ((evt.which === 8 || evt.which === 27) &&
          $scope.globals.isDrawActive) {
        $scope.globals.isDrawActive = false;
        $scope.$digest();
      }
    });

    // Browser back button management
    $scope.$watch('globals.isDrawActive', function(isActive) {
      if (isActive && gaHistory) {
        gaHistory.replaceState({
          isDrawActive: false
        }, '', gaPermalink.getHref());

        gaHistory.pushState(null, '', gaPermalink.getHref());
      }
    });
    $window.onpopstate = function(evt) {
      // When we go to full screen evt.state is null
      if (evt.state && evt.state.isDrawActive === false) {
        $scope.globals.isDrawActive = false;
        gaPermalink.refresh();
        $scope.$digest();
      }
    };

    // Management of panels display (only on screen bigger than 480px)
    win.on('resize', function() {
      // Hide catalog panel if height is too small
      if (gaWindow.isHeight('<=m')) {
        if ($scope.globals.catalogShown) {
          $scope.$applyAsync(function() {
            $scope.globals.catalogShown = false;
          });
        }
      }

      // Open share panel by default on phone
      if ($scope.globals.pulldownShown && !$scope.globals.isShareActive &&
          !$scope.globals.isDrawActive && gaWindow.isWidth('xs')) {
        $scope.$applyAsync(function() {
          $scope.globals.isShareActive = true;
        });
      }

	  // Define whether the tree pages settings panel should be displayed
      if ($scope.globals.showTreePageSettings) {
        if ((gaWindow.isWidth('<=m') && !$scope.globals.settingsShown) ||
          (gaWindow.isWidth('>m') && $scope.globals.settingsShown)) {
          $scope.$applyAsync(function() {
            $scope.globals.settingsShown = !$scope.globals.settingsShown;
          });
        }
      }

      // Display query tool
      if ((gaWindow.isWidth('<=m') && $scope.globals.queryShown) ||
         (gaWindow.isWidth('>m') && !$scope.globals.queryShown)) {
        $scope.$applyAsync(function() {
          $scope.globals.queryShown = !$scope.globals.queryShown;
          if (!$scope.globals.queryShown) {
            $scope.globals.isFeatureTreeActive = false;
          }
        });
      }
    });

    // Hide a panel clicking on its heading
    var hidePanel = function(id) {
      if ($('#' + id).hasClass('in')) {
        $('#' + id + 'Heading').trigger('click');
      }
    };

    var hideAccordionPanels = function() {
      hidePanel('share');
      hidePanel('print');
      hidePanel('tools');
    };

    $('#catalog').on('shown.bs.collapse', function() {
      if (gaWindow.isWidth('xs')) {
        return;
      }
      // Close accordion
      hideAccordionPanels();

      if (gaWindow.isHeight('<=s')) {
        // Close selection
        hidePanel('selection');
      }
    });

    $('#selection').on('shown.bs.collapse', function() {
      if (gaWindow.isWidth('xs')) {
        return;
      }
      // Close accordion
      hideAccordionPanels();

      if (gaWindow.isHeight('<=s')) {
        // Close catalog
        hidePanel('catalog');
      }
    });

    // Load new appcache file if available.
    if ($window.applicationCache) {
      $window.applicationCache.addEventListener('obsolete', function(e) {
        // setTimeout is needed for correct appcache update on Firefox
        setTimeout(function() {
          $window.location.reload(true);
        });
      });
    }
  });
//})();
