  var module = angular.module('ga_tab_directive', []);

  module.directive('gaTab', function() {
    return {
      restrict: 'A',
      transclude: true,
      require: '^gaTabs',
	  //define a local relative url
      templateUrl: 'geoadmin-module/components/tabs/partials/tab.html',
      scope: {
        title: '@gaTabTitle'
      },
      link: function(scope, elt, attrs, tabsCtrl) {
        elt.addClass('tab-pane');
        scope.active = false;
        tabsCtrl.addTab(scope);
      }
    };
  });
