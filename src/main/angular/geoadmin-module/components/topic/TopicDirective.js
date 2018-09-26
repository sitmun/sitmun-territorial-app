  var module = angular.module('ga_topic_directive', [
    'ga_topic_service'
  ]);

  module.directive('gaTopic',
      function($rootScope, $translate, $q, gaTopic, gaGlobalOptions) {
        return {
          restrict: 'A',
		  //define a local relative url
          templateUrl: 'geoadmin-module/components/topic/partials/topic.html',
          scope: {},
          link: function(scope, element, attrs) {
            var modal = element.find('.modal');

            var translateTopics = function(topics, forceTranslation) {
              forceTranslation = ((forceTranslation != null) && (forceTranslation != undefined))?
                                    forceTranslation:false;
			        //Check if there is topic information defined
              if (topics) {
                var name;
                for (var i = 0; i < topics.length; i++) {
                  if (forceTranslation || (!topics[i].name && (topics[i].name != ""))) {
                     name = $translate.instant(topics[i].id);
                     if ((name != topics[i].id) || (!topics[i].name)) {
                       //Make sure that we are not overwritting a valid value
                       topics[i].name = name;
                     }
                  }
                }
              }
              return topics;
            };

            // Because ng-repeat creates a new scope for each item in the
            // collection we can't use ng-click="activeTopic = topic" in
            // the template. Hence this intermediate function.
            // see: https://groups.google.com/forum/#!topic/angular/nS80gSdZBsE
            scope.setActiveTopic = function(newTopic) {
              scope.activeTopic = newTopic;
            };

            scope.localeSensitiveComparator = function(o1, o2) {
              try {
                var v1;
                var v2;

                if (o1 && (o1.groupId || o1.name)) {
                  v1 = o1;
                  v2 = o2;
                } else {
                  v1 = o1.value;
                  v2 = o2.value;

                  if (v1.groupId != undefined || v1.name != undefined) {
                    // Do nothing
                  } else {
                    if (topics && ((typeof o1.value == "number") || (typeof o1.value == "Number"))) {
                      v1 = scope.topics[o1.value];
                      v2 = scope.topics[o2.value];
                    } else {
                      return 0;
                    }
                  }
                }
                var groupId1 = v1.groupId;
                var groupId2 = v2.groupId;
                if (groupId1 !== groupId2 && typeof (groupId1) === 'number' &&
                    typeof (groupId2) === 'number') {
                  return groupId1 < groupId2 ? -1 : 1;
                }
                var name1 = v1.name;
                var name2 = v2.name;
                // Compare strings alphabetically, taking locale into account
                return name1.localeCompare(name2);
              } catch (e) {
				//In case of an error return 0 by default
                return 0;
              }
            };

            scope.$watch('activeTopic', function(newTopic) {
              if (newTopic && scope.topics) {
                modal.modal('hide');
                gaTopic.set(newTopic);
              }
            });

            $rootScope.$on('$translateChangeEnd', function() {
              scope.topics = translateTopics(gaTopic.getTopics(), true);
            });

            var onTopicChangeRegistered = false;

            function updateTopics() {
              var topicP = gaTopic.loadConfig();
              if (topicP != null) {
                $q.all([$translate.onReady, topicP]).then(
                  function() {
                    scope.topics = translateTopics(gaTopic.getTopics());
                    scope.activeTopic = gaTopic.get();
                    scope.$applyAsync(function() {
                      element.find('.ga-topic-item').tooltip({
                        container: modal,
                        placement: 'bottom'
                      });
                    });
                    if (!onTopicChangeRegistered) {
                      scope.$on('gaTopicChange', function(evt, newTopic) {
                        if (scope.activeTopic !== newTopic) {
                          scope.activeTopic = newTopic;
                        }
                      });
                      onTopicChangeRegistered = true;
                    }
                  });
              }
            }

            if (gaGlobalOptions.localConfigurationOverwrite) {
			        //Listen to topic configuration changes, the parent app will alter the respective tree directive attribute
              $rootScope.$on('gaTopicsConfigurationLoaded', function() {
                updateTopics();  
              });
            }
            //Try to update the topics information retrieving it from a local or remote file
            updateTopics();
          }
        };
      });
