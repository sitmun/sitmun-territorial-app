  var module = angular.module('ga_translation_service', [
    'ga_permalink_service'
  ]);

  /**
   * Lang manager
   */
  module.provider('gaLang', function() {
    this.$get = function($window, $rootScope, $translate, gaPermalink,
        gaGlobalOptions, gTranslationIndependentValues, 
        translatorUpdater) {
      var lang = gaPermalink.getParams().lang ||
          ($window.navigator.userLanguage ||
          $window.navigator.language).split('-')[0];

      if (gaGlobalOptions.languages.indexOf(lang) === -1) {
        lang = gaGlobalOptions.translationFallbackCode;
      }

      // Load translations via $translate service
      var loadTranslations = function(newLang) {
        if (newLang !== $translate.use()) {
          lang = newLang;
          $translate.use(lang).then(angular.noop, function() {
            // failed to load lang from server, fallback to default code.
            loadTranslations(gaGlobalOptions.translationFallbackCode);
          })['finally'](function() {
            gaPermalink.updateParams({lang: lang});
            translatorUpdater.reload();
          });
        }
      };
      loadTranslations(lang);

      var Lang = function() {

        this.set = function(newLang) {
          currentLanguage = newLang;
          loadTranslations(newLang);
        };

        this.get = function() {
          return $translate.use() || lang;
        };

        this.getNoRm = function() {
          return $translate.use() === 'rm' ?
            gaGlobalOptions.translationFallbackCode : this.get();
        };

        this.getCurrentLanguage = function() {
          return currentLanguage || lang;
        }

		//Add not translatable values to the current language translation configuration
        this.addTranslationIdependentValues = function(values) {
          angular.extend(gTranslationIndependentValues, values);
          this.reload();
        }

        this.reload = function() {
          translatorUpdater.reload();
        }
      };
      return new Lang();
    };
  });
