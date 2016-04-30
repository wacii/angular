import {
  beforeEach,
  ddescribe,
  xdescribe,
  describe,
  expect,
  iit,
  inject,
  beforeEachProviders,
  it,
  xit,
} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder} from '@angular/compiler/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

import {IS_DART} from '../../src/facade/lang';

import {
  Component,
  Pipe,
  PipeTransform,
  provide,
  ViewMetadata,
  PLATFORM_PIPES,
  OpaqueToken,
  Injector
} from '@angular/core';
import {CompilerConfig} from '@angular/compiler';

export function main() {
  if (IS_DART) {
    declareTests(false);
  } else {
    describe('jit', () => {
      beforeEachProviders(
          () => [provide(CompilerConfig, {useValue: new CompilerConfig(true, false, true)})]);
      declareTests(true);
    });

    describe('no jit', () => {
      beforeEachProviders(
          () => [provide(CompilerConfig, {useValue: new CompilerConfig(true, false, false)})]);
      declareTests(false);
    });
  }
}

function declareTests(isJit: boolean) {
  // Place to put reproductions for regressions
  describe('regressions', () => {

    describe('platform pipes', () => {
      beforeEachProviders(() => [provide(PLATFORM_PIPES, {useValue: [PlatformPipe], multi: true})]);

      it('should overwrite them by custom pipes',
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           tcb.overrideView(
                  MyComp1, new ViewMetadata({template: '{{true | somePipe}}', pipes: [CustomPipe]}))
               .createAsync(MyComp1)
               .then((fixture) => {
                 fixture.detectChanges();
                 expect(fixture.nativeElement).toHaveText('someCustomPipe');
                 async.done();
               });
         }));
    });

    describe('expressions', () => {

      it('should evaluate conditional and boolean operators with right precedence - #8244',
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           tcb.overrideView(MyComp1,
                            new ViewMetadata({template: `{{'red' + (true ? ' border' : '')}}`}))
               .createAsync(MyComp1)
               .then((fixture) => {
                 fixture.detectChanges();
                 expect(fixture.nativeElement).toHaveText('red border');
                 async.done();
               });
         }));

      if (!IS_DART) {
        it('should evaluate conditional and unary operators with right precedence - #8235',
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {
                    tcb.overrideView(MyComp1, new ViewMetadata({template: `{{!null?.length}}`}))
                        .createAsync(MyComp1)
                        .then((fixture) => {
                          fixture.detectChanges();
                          expect(fixture.nativeElement).toHaveText('true');
                          async.done();
                        });
                  }));
      }
    });

    describe('providers', () => {
      function createInjector(tcb: TestComponentBuilder, proviers: any[]): Promise<Injector> {
        return tcb.overrideProviders(MyComp1, [proviers])
            .createAsync(MyComp1)
            .then((fixture) => fixture.componentInstance.injector);
      }

      it('should support providers with an OpaqueToken that contains a `.` in the name',
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var token = new OpaqueToken('a.b');
           var tokenValue = 1;
           createInjector(tcb, [provide(token, {useValue: tokenValue})])
               .then((injector: Injector) => {
                 expect(injector.get(token)).toEqual(tokenValue);
                 async.done();
               });
         }));

      it('should support providers with string token with a `.` in it',
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var token = 'a.b';
           var tokenValue = 1;
           createInjector(tcb, [provide(token, {useValue: tokenValue})])
               .then((injector: Injector) => {
                 expect(injector.get(token)).toEqual(tokenValue);
                 async.done();
               });
         }));

      it('should support providers with an anonymous function',
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var token = () => true;
           var tokenValue = 1;
           createInjector(tcb, [provide(token, {useValue: tokenValue})])
               .then((injector: Injector) => {
                 expect(injector.get(token)).toEqual(tokenValue);
                 async.done();
               });
         }));

      it('should support providers with an OpaqueToken that has a StringMap as value',
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var token1 = new OpaqueToken('someToken');
           var token2 = new OpaqueToken('someToken');
           var tokenValue1 = {'a': 1};
           var tokenValue2 = {'a': 1};
           createInjector(
               tcb,
               [provide(token1, {useValue: tokenValue1}), provide(token2, {useValue: tokenValue2})])
               .then((injector: Injector) => {
                 expect(injector.get(token1)).toEqual(tokenValue1);
                 expect(injector.get(token2)).toEqual(tokenValue2);
                 async.done();
               });
         }));
    });

    it('should allow logging a previous elements class binding via interpolation',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         tcb.overrideTemplate(MyComp1, `<div [class.a]="true" #el>Class: {{el.className}}</div>`)
             .createAsync(MyComp1)
             .then((fixture) => {
               fixture.detectChanges();
               expect(fixture.nativeElement).toHaveText('Class: a');
               async.done();
             });
       }));

  });
}

@Component({selector: 'my-comp', template: ''})
class MyComp1 {
  constructor(public injector: Injector) {}
}

@Pipe({name: 'somePipe', pure: true})
class PlatformPipe implements PipeTransform {
  transform(value: any): any { return 'somePlatformPipe'; }
}

@Pipe({name: 'somePipe', pure: true})
class CustomPipe implements PipeTransform {
  transform(value: any): any { return 'someCustomPipe'; }
}
