import {resolveForwardRef} from 'angular2/src/core/di';
import {
  Type,
  isBlank,
  isPresent,
  isArray,
  stringify,
  isString,
  isStringMap,
  RegExpWrapper,
  StringWrapper
} from 'angular2/src/facade/lang';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {BaseException} from 'angular2/src/facade/exceptions';
import * as cpl from './compile_metadata';
import * as md from 'angular2/src/core/metadata/directives';
import * as dimd from 'angular2/src/core/metadata/di';
import {DirectiveResolver} from './directive_resolver';
import {PipeResolver} from './pipe_resolver';
import {ViewResolver} from './view_resolver';
import {ViewMetadata} from 'angular2/src/core/metadata/view';
import {hasLifecycleHook} from './directive_lifecycle_reflector';
import {LifecycleHooks, LIFECYCLE_HOOKS_VALUES} from 'angular2/src/core/metadata/lifecycle_hooks';
import {reflector} from 'angular2/src/core/reflection/reflection';
import {Injectable, Inject, Optional} from 'angular2/src/core/di';
import {PLATFORM_DIRECTIVES, PLATFORM_PIPES} from 'angular2/src/core/platform_directives_and_pipes';
import {MODULE_SUFFIX, sanitizeIdentifier} from './util';
import {assertArrayOfStrings} from './assertions';
import {getUrlScheme} from 'angular2/src/compiler/url_resolver';
import {Provider} from 'angular2/src/core/di/provider';
import {
  OptionalMetadata,
  SelfMetadata,
  HostMetadata,
  SkipSelfMetadata,
  InjectMetadata
} from 'angular2/src/core/di/metadata';
import {AttributeMetadata, QueryMetadata} from 'angular2/src/core/metadata/di';
import {ReflectorReader} from 'angular2/src/core/reflection/reflector_reader';
import {isProviderLiteral, createProvider} from '../core/di/provider_util';

@Injectable()
export class CompileMetadataResolver {
  private _directiveCache = new Map<Type, cpl.CompileDirectiveMetadata>();
  private _pipeCache = new Map<Type, cpl.CompilePipeMetadata>();
  private _anonymousTypes = new Map<Object, number>();
  private _anonymousTypeIndex = 0;
  private _reflector: ReflectorReader;

  constructor(private _directiveResolver: DirectiveResolver, private _pipeResolver: PipeResolver,
              private _viewResolver: ViewResolver,
              @Optional() @Inject(PLATFORM_DIRECTIVES) private _platformDirectives: Type[],
              @Optional() @Inject(PLATFORM_PIPES) private _platformPipes: Type[],
              _reflector?: ReflectorReader) {
    if (isPresent(_reflector)) {
      this._reflector = _reflector;
    } else {
      this._reflector = reflector;
    }
  }

  private sanitizeTokenName(token: any): string {
    let identifier = stringify(token);
    if (identifier.indexOf('(') >= 0) {
      // case: anonymous functions!
      let found = this._anonymousTypes.get(token);
      if (isBlank(found)) {
        this._anonymousTypes.set(token, this._anonymousTypeIndex++);
        found = this._anonymousTypes.get(token);
      }
      identifier = `anonymous_token_${found}_`;
    }
    return sanitizeIdentifier(identifier);
  }

  getDirectiveMetadata(directiveType: Type): cpl.CompileDirectiveMetadata {
    var meta = this._directiveCache.get(directiveType);
    if (isBlank(meta)) {
      var dirMeta = this._directiveResolver.resolve(directiveType);
      var templateMeta = null;
      var changeDetectionStrategy = null;
      var viewProviders = [];

      if (dirMeta instanceof md.ComponentMetadata) {
        assertArrayOfStrings('styles', dirMeta.styles);
        var cmpMeta = <md.ComponentMetadata>dirMeta;
        var viewMeta = this._viewResolver.resolve(directiveType);
        assertArrayOfStrings('styles', viewMeta.styles);
        templateMeta = new cpl.CompileTemplateMetadata({
          encapsulation: viewMeta.encapsulation,
          template: viewMeta.template,
          templateUrl: viewMeta.templateUrl,
          styles: viewMeta.styles,
          styleUrls: viewMeta.styleUrls,
          baseUrl: calcTemplateBaseUrl(this._reflector, directiveType, cmpMeta)
        });
        changeDetectionStrategy = cmpMeta.changeDetection;
        if (isPresent(dirMeta.viewProviders)) {
          viewProviders = this.getProvidersMetadata(dirMeta.viewProviders);
        }
      }

      var providers = [];
      if (isPresent(dirMeta.providers)) {
        providers = this.getProvidersMetadata(dirMeta.providers);
      }
      var queries = [];
      var viewQueries = [];
      if (isPresent(dirMeta.queries)) {
        queries = this.getQueriesMetadata(dirMeta.queries, false);
        viewQueries = this.getQueriesMetadata(dirMeta.queries, true);
      }
      meta = cpl.CompileDirectiveMetadata.create({
        selector: dirMeta.selector,
        exportAs: dirMeta.exportAs,
        isComponent: isPresent(templateMeta),
        type: this.getTypeMetadata(directiveType, staticTypeModuleUrl(directiveType)),
        template: templateMeta,
        changeDetection: changeDetectionStrategy,
        inputs: dirMeta.inputs,
        outputs: dirMeta.outputs,
        host: dirMeta.host,
        lifecycleHooks:
            LIFECYCLE_HOOKS_VALUES.filter(hook => hasLifecycleHook(hook, directiveType)),
        providers: providers,
        viewProviders: viewProviders,
        queries: queries,
        viewQueries: viewQueries
      });
      this._directiveCache.set(directiveType, meta);
    }
    return meta;
  }

  /**
   * @param someType a symbol which may or may not be a directive type
   * @returns {cpl.CompileDirectiveMetadata} if possible, otherwise null.
   */
  maybeGetDirectiveMetadata(someType: Type): cpl.CompileDirectiveMetadata {
    try {
      return this.getDirectiveMetadata(someType);
    } catch (e) {
      if (e.message.indexOf('No Directive annotation') !== -1) {
        return null;
      }
      throw e;
    }
  }

  getTypeMetadata(type: Type, moduleUrl: string): cpl.CompileTypeMetadata {
    return new cpl.CompileTypeMetadata({
      name: this.sanitizeTokenName(type),
      moduleUrl: moduleUrl,
      runtime: type,
      diDeps: this.getDependenciesMetadata(type, null)
    });
  }

  getFactoryMetadata(factory: Function, moduleUrl: string): cpl.CompileFactoryMetadata {
    return new cpl.CompileFactoryMetadata({
      name: this.sanitizeTokenName(factory),
      moduleUrl: moduleUrl,
      runtime: factory,
      diDeps: this.getDependenciesMetadata(factory, null)
    });
  }

  getPipeMetadata(pipeType: Type): cpl.CompilePipeMetadata {
    var meta = this._pipeCache.get(pipeType);
    if (isBlank(meta)) {
      var pipeMeta = this._pipeResolver.resolve(pipeType);
      meta = new cpl.CompilePipeMetadata({
        type: this.getTypeMetadata(pipeType, staticTypeModuleUrl(pipeType)),
        name: pipeMeta.name,
        pure: pipeMeta.pure,
        lifecycleHooks: LIFECYCLE_HOOKS_VALUES.filter(hook => hasLifecycleHook(hook, pipeType)),
      });
      this._pipeCache.set(pipeType, meta);
    }
    return meta;
  }

  getViewDirectivesMetadata(component: Type): cpl.CompileDirectiveMetadata[] {
    var view = this._viewResolver.resolve(component);
    var directives = flattenDirectives(view, this._platformDirectives);
    for (var i = 0; i < directives.length; i++) {
      if (!isValidType(directives[i])) {
        throw new BaseException(
            `Unexpected directive value '${stringify(directives[i])}' on the View of component '${stringify(component)}'`);
      }
    }
    return directives.map(type => this.getDirectiveMetadata(type));
  }

  getViewPipesMetadata(component: Type): cpl.CompilePipeMetadata[] {
    var view = this._viewResolver.resolve(component);
    var pipes = flattenPipes(view, this._platformPipes);
    for (var i = 0; i < pipes.length; i++) {
      if (!isValidType(pipes[i])) {
        throw new BaseException(
            `Unexpected piped value '${stringify(pipes[i])}' on the View of component '${stringify(component)}'`);
      }
    }
    return pipes.map(type => this.getPipeMetadata(type));
  }

  getDependenciesMetadata(typeOrFunc: Type | Function,
                          dependencies: any[]): cpl.CompileDiDependencyMetadata[] {
    let params = isPresent(dependencies) ? dependencies : this._reflector.parameters(typeOrFunc);
    if (isBlank(params)) {
      params = [];
    }
    return params.map((param) => {
      if (isBlank(param)) {
        return null;
      }
      let isAttribute = false;
      let isHost = false;
      let isSelf = false;
      let isSkipSelf = false;
      let isOptional = false;
      let query: dimd.QueryMetadata = null;
      let viewQuery: dimd.ViewQueryMetadata = null;
      var token = null;
      if (isArray(param)) {
        (<any[]>param)
            .forEach((paramEntry) => {
              if (paramEntry instanceof HostMetadata) {
                isHost = true;
              } else if (paramEntry instanceof SelfMetadata) {
                isSelf = true;
              } else if (paramEntry instanceof SkipSelfMetadata) {
                isSkipSelf = true;
              } else if (paramEntry instanceof OptionalMetadata) {
                isOptional = true;
              } else if (paramEntry instanceof AttributeMetadata) {
                isAttribute = true;
                token = paramEntry.attributeName;
              } else if (paramEntry instanceof QueryMetadata) {
                if (paramEntry.isViewQuery) {
                  viewQuery = paramEntry;
                } else {
                  query = paramEntry;
                }
              } else if (paramEntry instanceof InjectMetadata) {
                token = paramEntry.token;
              } else if (isValidType(paramEntry) && isBlank(token)) {
                token = paramEntry;
              }
            });
      } else {
        token = param;
      }
      if (isBlank(token)) {
        return null;
      }
      return new cpl.CompileDiDependencyMetadata({
        isAttribute: isAttribute,
        isHost: isHost,
        isSelf: isSelf,
        isSkipSelf: isSkipSelf,
        isOptional: isOptional,
        query: isPresent(query) ? this.getQueryMetadata(query, null) : null,
        viewQuery: isPresent(viewQuery) ? this.getQueryMetadata(viewQuery, null) : null,
        token: this.getTokenMetadata(token)
      });

    });
  }

  getTokenMetadata(token: any): cpl.CompileTokenMetadata {
    token = resolveForwardRef(token);
    var compileToken;
    if (isString(token)) {
      compileToken = new cpl.CompileTokenMetadata({value: token});
    } else {
      compileToken = new cpl.CompileTokenMetadata({
        identifier: new cpl.CompileIdentifierMetadata({
          runtime: token,
          name: this.sanitizeTokenName(token),
          moduleUrl: staticTypeModuleUrl(token)
        })
      });
    }
    return compileToken;
  }

  getProvidersMetadata(providers: any[]):
      Array<cpl.CompileProviderMetadata | cpl.CompileTypeMetadata | any[]> {
    return providers.map((provider) => {
      provider = resolveForwardRef(provider);
      if (isArray(provider)) {
        return this.getProvidersMetadata(provider);
      } else if (provider instanceof Provider) {
        return this.getProviderMetadata(provider);
      } else if (isProviderLiteral(provider)) {
        return this.getProviderMetadata(createProvider(provider));
      } else {
        return this.getTypeMetadata(provider, staticTypeModuleUrl(provider));
      }
    });
  }

  getProviderMetadata(provider: Provider): cpl.CompileProviderMetadata {
    var compileDeps;
    if (isPresent(provider.useClass)) {
      compileDeps = this.getDependenciesMetadata(provider.useClass, provider.dependencies);
    } else if (isPresent(provider.useFactory)) {
      compileDeps = this.getDependenciesMetadata(provider.useFactory, provider.dependencies);
    }
    return new cpl.CompileProviderMetadata({
      token: this.getTokenMetadata(provider.token),
      useClass:
          isPresent(provider.useClass) ?
              this.getTypeMetadata(provider.useClass, staticTypeModuleUrl(provider.useClass)) :
              null,
      useValue: isPresent(provider.useValue) ?
                    new cpl.CompileIdentifierMetadata({runtime: provider.useValue}) :
                    null,
      useFactory: isPresent(provider.useFactory) ?
                      this.getFactoryMetadata(provider.useFactory,
                                              staticTypeModuleUrl(provider.useFactory)) :
                      null,
      useExisting: isPresent(provider.useExisting) ? this.getTokenMetadata(provider.useExisting) :
                                                     null,
      deps: compileDeps,
      multi: provider.multi
    });
  }

  getQueriesMetadata(queries: {[key: string]: dimd.QueryMetadata},
                     isViewQuery: boolean): cpl.CompileQueryMetadata[] {
    var compileQueries = [];
    StringMapWrapper.forEach(queries, (query, propertyName) => {
      if (query.isViewQuery === isViewQuery) {
        compileQueries.push(this.getQueryMetadata(query, propertyName));
      }
    });
    return compileQueries;
  }

  getQueryMetadata(q: dimd.QueryMetadata, propertyName: string): cpl.CompileQueryMetadata {
    var selectors;
    if (q.isVarBindingQuery) {
      selectors = q.varBindings.map(varName => this.getTokenMetadata(varName));
    } else {
      selectors = [this.getTokenMetadata(q.selector)];
    }
    return new cpl.CompileQueryMetadata({
      selectors: selectors,
      first: q.first,
      descendants: q.descendants,
      propertyName: propertyName,
      read: isPresent(q.read) ? this.getTokenMetadata(q.read) : null
    });
  }
}

function flattenDirectives(view: ViewMetadata, platformDirectives: any[]): Type[] {
  let directives = [];
  if (isPresent(platformDirectives)) {
    flattenArray(platformDirectives, directives);
  }
  if (isPresent(view.directives)) {
    flattenArray(view.directives, directives);
  }
  return directives;
}

function flattenPipes(view: ViewMetadata, platformPipes: any[]): Type[] {
  let pipes = [];
  if (isPresent(platformPipes)) {
    flattenArray(platformPipes, pipes);
  }
  if (isPresent(view.pipes)) {
    flattenArray(view.pipes, pipes);
  }
  return pipes;
}

function flattenArray(tree: any[], out: Array<Type | any[]>): void {
  for (var i = 0; i < tree.length; i++) {
    var item = resolveForwardRef(tree[i]);
    if (isArray(item)) {
      flattenArray(item, out);
    } else {
      out.push(item);
    }
  }
}

function isStaticType(value: any): boolean {
  return isStringMap(value) && isPresent(value['name']) && isPresent(value['moduleId']);
}

function isValidType(value: any): boolean {
  return isStaticType(value) || (value instanceof Type);
}

function staticTypeModuleUrl(value: any): string {
  return isStaticType(value) ? value['moduleId'] : null;
}


function calcTemplateBaseUrl(reflector: ReflectorReader, type: any,
                             cmpMetadata: md.ComponentMetadata): string {
  if (isStaticType(type)) {
    return type['filePath'];
  }

  if (isPresent(cmpMetadata.moduleId)) {
    var moduleId = cmpMetadata.moduleId;
    var scheme = getUrlScheme(moduleId);
    return isPresent(scheme) && scheme.length > 0 ? moduleId :
                                                    `package:${moduleId}${MODULE_SUFFIX}`;
  }

  return reflector.importUri(type);
}
