import {assertionsEnabled} from 'angular2/src/facade/lang';
import {DOM} from 'angular2/src/platform/dom/dom_adapter';
import {DebugNode, getDebugNode} from 'angular2/src/core/debug/debug_node';
import {DomRootRenderer} from 'angular2/src/platform/dom/dom_renderer';
import {RootRenderer, NgZone, ApplicationRef} from 'angular2/core';
import {DebugDomRootRenderer} from 'angular2/src/core/debug/debug_renderer';

const CORE_TOKENS = /*@ts2dart_const*/ {'ApplicationRef': ApplicationRef, 'NgZone': NgZone};

const INSPECT_GLOBAL_NAME = 'ng.probe';
const CORE_TOKENS_GLOBAL_NAME = 'ng.coreTokens';

/**
 * Returns a {@link DebugElement} for the given native DOM element, or
 * null if the given native element does not have an Angular view associated
 * with it.
 */
export function inspectNativeElement(element): DebugNode {
  return getDebugNode(element);
}

function _createConditionalRootRenderer(rootRenderer) {
  if (assertionsEnabled()) {
    return _createRootRenderer(rootRenderer);
  }
  return rootRenderer;
}

function _createRootRenderer(rootRenderer) {
  DOM.setGlobalVar(INSPECT_GLOBAL_NAME, inspectNativeElement);
  DOM.setGlobalVar(CORE_TOKENS_GLOBAL_NAME, CORE_TOKENS);
  return new DebugDomRootRenderer(rootRenderer);
}

/**
 * Providers which support debugging Angular applications (e.g. via `ng.probe`).
 */
export const ELEMENT_PROBE_PROVIDERS: any[] = /*@ts2dart_const*/[
  /*@ts2dart_Provider*/ {
    provide: RootRenderer,
    useFactory: _createConditionalRootRenderer,
    deps: [DomRootRenderer]
  }
];

export const ELEMENT_PROBE_PROVIDERS_PROD_MODE: any[] = /*@ts2dart_const*/[
  /*@ts2dart_Provider*/ {
    provide: RootRenderer,
    useFactory: _createRootRenderer,
    deps: [DomRootRenderer]
  }
];
