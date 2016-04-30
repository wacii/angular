import {IS_DART, StringWrapper} from '../src/facade/lang';

export var MODULE_SUFFIX = IS_DART ? '.dart' : '';

var CAMEL_CASE_REGEXP = /([A-Z])/g;
var DASH_CASE_REGEXP = /-([a-z])/g;

export function camelCaseToDashCase(input: string): string {
  return StringWrapper.replaceAllMapped(input, CAMEL_CASE_REGEXP,
                                        (m) => { return '-' + m[1].toLowerCase(); });
}

export function dashCaseToCamelCase(input: string): string {
  return StringWrapper.replaceAllMapped(input, DASH_CASE_REGEXP,
                                        (m) => { return m[1].toUpperCase(); });
}

export function splitAtColon(input: string, defaultValues: string[]): string[] {
  var parts = StringWrapper.split(input.trim(), /\s*:\s*/g);
  if (parts.length > 1) {
    return parts;
  } else {
    return defaultValues;
  }
}

export function sanitizeIdentifier(name: string): string {
  return StringWrapper.replaceAll(name, /\W/g, '_');
}

export function assetUrl(pkg: string, path: string = null, type:string = 'src'): string {
  if (IS_DART) {
    if (path == null) {
      return `asset:angular2/${pkg}/${pkg}.dart`;
    } else {
      return `asset:angular2/lib/${pkg}/src/${path}.dart`;
    }
  } else {
    if (path == null) {
      return `asset:@angular/lib/${pkg}/index`;
    } else {
      return `asset:@angular/lib/${pkg}/src/${path}`;
    }
  }
}
