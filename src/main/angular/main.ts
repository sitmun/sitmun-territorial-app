import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { UpgradeModule } from '@angular/upgrade/static';

import angular from 'angular';

if (environment.production) {
  enableProdMode();
}

// Ensure AngularJS destroys itself on hot reloads.
const rootElement = angular.element(document.body);
const oldInjector = rootElement.injector();
if (oldInjector) {
  oldInjector.get('$rootScope').$destroy();
  rootElement.data('$injector', null);
}

// Ensure Angular destroys itself on hot reloads.
if (window['ngRef']) {
  window['ngRef'].destroy();
}

platformBrowserDynamic().
  bootstrapModule(AppModule).
  then(ref => { 
    window['ngRef'] = ref;
  }).
  catch(console.error);
