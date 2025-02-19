import {
  APP_ID,
  NgZone,
  Provider,
  PLATFORM_COMMON_PROVIDERS,
  PLATFORM_INITIALIZER
} from 'angular2/core';
import {DirectiveResolver, ViewResolver} from 'angular2/compiler';
import {BROWSER_APP_COMMON_PROVIDERS} from 'angular2/src/platform/browser_common';
import {BrowserDomAdapter} from 'angular2/src/platform/browser/browser_adapter';

import {AnimationBuilder} from 'angular2/src/animate/animation_builder';
import {MockAnimationBuilder} from 'angular2/src/mock/animation_builder_mock';
import {MockDirectiveResolver} from 'angular2/src/mock/directive_resolver_mock';
import {MockViewResolver} from 'angular2/src/mock/view_resolver_mock';
import {MockLocationStrategy} from 'angular2/src/mock/mock_location_strategy';
import {LocationStrategy} from 'angular2/platform/common';
import {MockNgZone} from 'angular2/src/mock/ng_zone_mock';

import {XHRImpl} from "angular2/src/platform/browser/xhr_impl";
import {XHR} from 'angular2/compiler';

import {
  TestComponentBuilder,
  ComponentFixtureAutoDetect,
  ComponentFixtureNoNgZone
} from 'angular2/src/testing/test_component_builder';

import {BrowserDetection} from 'angular2/src/testing/utils';

import {ELEMENT_PROBE_PROVIDERS} from 'angular2/platform/common_dom';

import {IS_DART} from 'angular2/src/facade/lang';

import {Log} from 'angular2/src/testing/utils';

function initBrowserTests() {
  BrowserDomAdapter.makeCurrent();
  BrowserDetection.setup();
}

function createNgZone(): NgZone {
  return IS_DART ? new MockNgZone() : new NgZone({enableLongStackTrace: true});
}

/**
 * Default platform providers for testing without a compiler.
 */
export const TEST_BROWSER_STATIC_PLATFORM_PROVIDERS: Array<any /*Type | Provider | any[]*/> =
    /*@ts2dart_const*/[
      PLATFORM_COMMON_PROVIDERS,
      /*@ts2dart_Provider*/{provide: PLATFORM_INITIALIZER, useValue: initBrowserTests, multi: true}
    ];

export const ADDITIONAL_TEST_BROWSER_PROVIDERS: Array<any /*Type | Provider | any[]*/> =
    /*@ts2dart_const*/[
      /*@ts2dart_Provider*/ {provide: APP_ID, useValue: 'a'},
      ELEMENT_PROBE_PROVIDERS,
      /*@ts2dart_Provider*/ {provide: DirectiveResolver, useClass: MockDirectiveResolver},
      /*@ts2dart_Provider*/ {provide: ViewResolver, useClass: MockViewResolver},
      Log,
      TestComponentBuilder,
      /*@ts2dart_Provider*/ {provide: NgZone, useFactory: createNgZone},
      /*@ts2dart_Provider*/ {provide: LocationStrategy, useClass: MockLocationStrategy},
      /*@ts2dart_Provider*/ {provide: AnimationBuilder, useClass: MockAnimationBuilder},
    ];

/**
 * Default application providers for testing without a compiler.
 */
export const TEST_BROWSER_STATIC_APPLICATION_PROVIDERS: Array<any /*Type | Provider | any[]*/> =
    /*@ts2dart_const*/[
      BROWSER_APP_COMMON_PROVIDERS,
      /*@ts2dart_Provider*/ {provide: XHR, useClass: XHRImpl},
      ADDITIONAL_TEST_BROWSER_PROVIDERS
    ];
