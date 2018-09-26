  var module = angular.module('ga_topic_service', [
    'ga_permalink',
    'ga_translation_service'
  ]);

  /**
   * Topics manager
   */
  module.provider('gaTopic', function() {
    this.$get = function($rootScope, $http, $translate, gaPermalink,
        gaGlobalOptions, gaUrlUtils, gaLang) {
      var topic; // The current topic
      var topics = []; // The list of topics available
      var baseLayerGroups = [];

      // Load the topics config from an object or a remote or local file
      var loadTopicsConfig = function(url) {
        if (!url) {
          return;
        }
        var parseResponse  = function(response) {
          if (!response.data) {
            return;
          }
          var loadTranslationValues = response.loadTranslationValues;
          var updateTopics = false;
          if (response.data.topics) {
            updateTopics = true;
            topics = response.data.topics;
          }
          var updateBaseGroups = false;
          if (response.data.baseGroups) {
            updateBaseGroups = true;
            baseLayerGroups = response.data.baseGroups;
          }
          if (updateTopics) {
            var translationValues = {};
            angular.forEach(topics, function(value) {
              value.tooltip = 'topic_' + value.id + '_tooltip';
              value.langs = gaGlobalOptions.languages;
              if (!value.activatedLayers) {
                value.activatedLayers = [];
              }
              if (!value.plConfig || !value.plConfig.length) {
                value.plConfig = false;
              } else {
                // plConfig overwrites some default settings. So we
                // apply them here
                var p = gaUrlUtils.parseKeyValue(value.plConfig);
                // Overwrite background layer if available
                if (p.bgLayer) {
                  value.defaultBackground = p.bgLayer;
                }
                // Overwrite activated and selected layers
                if (p.layers && p.layers.length) {
                  value.activatedLayers = [];
                  value.selectedLayers = [];
                  var ls = p.layers.split(',');
                  var lv = p.layers_visibility ?
                    p.layers_visibility.split(',') : [];
                  for (var i = 0; i < ls.length; i++) {
                    if (i < lv.length && lv[i] !== 'false') {
                      value.selectedLayers.push(ls[i]);
                    } else {
                      value.activatedLayers.push(ls[i]);
                    }
                  }
                }
              }
              if (loadTranslationValues) {
                translationValues[value.id] = value.name;
                translationValues[value.tooltip] = value.name;
              }
            });
            if (loadTranslationValues) {
              gaLang.addTranslationIdependentValues(translationValues);
            }
          }
          if (updateBaseGroups && (baseLayerGroups != undefined) && (baseLayerGroups.length > 0)) {
			//Notify the base layer groups modification, it will be propagated to the map component
            $rootScope.$broadcast('gaBaselayersGroupConfiguration', 
                                  baseLayerGroups);
          }
          topic = getTopicById(gaPermalink.getParams().topic, true);
          if (topic) {
            broadcast();
          }
        };
        if (typeof url != "string") {
          //Use the url to index the topic data
          return new Promise(function(resolve, reject) {
                              if ((typeof url).toLowerCase() == "object") {
                                resolve({
                                          data: url,
                                          loadTranslationValues: true
                                        });
                              } else {
                                reject(Error("Not a valid topics configuration loaded"));
                              }
                            }).then(parseResponse);
        } else {
          return $http.get(url).then(parseResponse);
        }
      };

      var getTopicById = function(id, useFallbackTopic) {
        if (topics) {
          for (var i = 0, ii = topics.length; i < ii; i++) {
            if (topics[i].id === id) {
              return topics[i];
            }
          }
        }
        if (useFallbackTopic) {
          // If the topic doesn't exist we load the default one
          var defaultTopic = getTopicById(gaGlobalOptions.defaultTopicId,
              false);
          // If the default topic doesn't exist we load the first one
          if (!defaultTopic) {
            if (topics) {
              return topics[0];
            } else {
              return null;
            }
          }
          return defaultTopic;
        }
      };

      var broadcast = function() {
        if (gaPermalink.getParams().topic !== topic.id) {
          gaPermalink.updateParams({topic: topic.id});
        }
        $rootScope.$broadcast('gaTopicChange', topic);
      };

      var Topic = function(topicsUrl) {

        // We load the topics configuration
        var topicsP = loadTopicsConfig(topicsUrl);

        // Returns a promise that is resolved when topics are loaded
        this.loadConfig = function() {
          return topicsP;
        };

        var catalogs = {};

		//Retrieve the topics information from an object
        this.loadTopicsConfiguration = function(topicsConfiguration, catalogsConfiguration) {
          if (catalogsConfiguration) {
            catalogs = catalogsConfiguration;
          } else {
            catalogs = {};
          }
          topicsP = loadTopicsConfig(topicsConfiguration);
          $rootScope.$broadcast("gaTopicsConfigurationLoaded");
        }

		//Retrieve the base layer groups (backgrounds) information from an object
        this.updateBaseGroupsConfiguration = function(configuration) {
          var updateBaseGroups = false;
          if (configuration.baseGroups) {
            updateBaseGroups = true;
            baseLayerGroups = configuration.baseGroups;
          }
          if (updateBaseGroups && (baseLayerGroups != undefined) && (baseLayerGroups.length > 0)) {
            $rootScope.$broadcast('gaBaselayersGroupConfiguration', 
                                  baseLayerGroups);
          }
        }

        // Returns the topics loaded. Should be used only after the
        // load config promise is resolved.
        this.getTopics = function() {
          return topics;
        };

        this.getCatalogs = function() {
          return catalogs;
        }

        this.set = function(newTopic, force) {
          if (newTopic) {
            this.setById(newTopic.id, force);
          }
        };

        this.setById = function(newTopicId, force) {
          if (force || !topic || newTopicId !== topic.id) {
            var newTopic = getTopicById(newTopicId, false);
            if (newTopic) {
              topic = newTopic;
              broadcast();
            }
          }
        };

        this.get = function() {
          return topic;
        };
      };
      return new Topic(this.topicsUrl);
    };
  });
