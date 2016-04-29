import * as selector from './src/selector';
import * as staticReflector from './src/static_reflector';

export namespace __compiler_private__ {
  export type SelectorMatcher = selector.SelectorMatcher;
  export var SelectorMatcher = selector.SelectorMatcher;

  export type CssSelector = selector.CssSelector;
  export var CssSelector = selector.CssSelector;

  export type StaticReflector = staticReflector.StaticReflector;
  export var StaticReflector = staticReflector.StaticReflector;

  export type StaticReflectorHost = staticReflector.StaticReflectorHost;

  export type StaticSymbol = staticReflector.StaticSymbol;
  export var StaticSymbol = staticReflector.StaticSymbol;
}
