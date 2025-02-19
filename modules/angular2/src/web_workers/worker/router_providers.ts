import {ApplicationRef, Provider, NgZone, APP_INITIALIZER} from 'angular2/core';
import {PlatformLocation} from 'angular2/platform/common';
import {WebWorkerPlatformLocation} from './platform_location';
import {ROUTER_PROVIDERS_COMMON} from 'angular2/src/router/router_providers_common';

export var WORKER_APP_ROUTER = [
  ROUTER_PROVIDERS_COMMON,
  /* @ts2dart_Provider */ {provide: PlatformLocation, useClass: WebWorkerPlatformLocation},
  {
    provide: APP_INITIALIZER,
    useFactory: (platformLocation: WebWorkerPlatformLocation, zone: NgZone) => () =>
                    initRouter(platformLocation, zone),
    multi: true,
    deps: [PlatformLocation, NgZone]
  }
];

function initRouter(platformLocation: WebWorkerPlatformLocation, zone: NgZone): Promise<boolean> {
  return zone.runGuarded(() => { return platformLocation.init(); });
}
