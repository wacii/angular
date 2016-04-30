import {
  AsyncTestCompleter,
  beforeEach,
  ddescribe,
  xdescribe,
  describe,
  dispatchEvent,
  expect,
  iit,
  inject,
  beforeEachProviders,
  withProviders,
  it,
  xit,
  TestComponentBuilder,
  ComponentFixtureAutoDetect,
  ComponentFixtureNoNgZone
} from 'angular2/testing_internal';

import {Injectable, provide} from 'angular2/core';
import {NgIf} from 'angular2/common';
import {Directive, Component, ViewMetadata, Input} from 'angular2/src/core/metadata';
import {IS_DART} from 'angular2/src/facade/lang';
import {PromiseWrapper} from 'angular2/src/facade/promise';

@Component(
    {selector: 'child-comp', template: `<span>Original {{childBinding}}</span>`, directives: []})
@Injectable()
class ChildComp {
  childBinding: string;
  constructor() { this.childBinding = 'Child'; }
}

@Component({selector: 'child-comp', template: `<span>Mock</span>`})
@Injectable()
class MockChildComp {
}

@Component({
  selector: 'parent-comp',
  template: `Parent(<child-comp></child-comp>)`,
  directives: [ChildComp]
})
@Injectable()
class ParentComp {
}

@Component({
  selector: 'my-if-comp',
  template: `MyIf(<span *ngIf="showMore">More</span>)`,
  directives: [NgIf]
})
@Injectable()
class MyIfComp {
  showMore: boolean = false;
}

@Component({selector: 'child-child-comp', template: `<span>ChildChild</span>`})
@Injectable()
class ChildChildComp {
}

@Component({
  selector: 'child-comp',
  template: `<span>Original {{childBinding}}(<child-child-comp></child-child-comp>)</span>`,
  directives: [ChildChildComp]
})
@Injectable()
class ChildWithChildComp {
  childBinding: string;
  constructor() { this.childBinding = 'Child'; }
}

@Component({selector: 'child-child-comp', template: `<span>ChildChild Mock</span>`})
@Injectable()
class MockChildChildComp {
}

@Component({selector: 'autodetect-comp', template: `<span (click)='click()'>{{text}}</span>`})
class AutoDetectComp {
  text: string = '1';

  click() { this.text += '1'; }
}

@Component({selector: 'async-comp', template: `<span (click)='click()'>{{text}}</span>`})
class AsyncComp {
  text: string = '1';

  click() {
    PromiseWrapper.resolve(null).then((_) => { this.text += '1'; });
  }
}

@Component({selector: 'async-child-comp', template: '<span>{{localText}}</span>'})
class AsyncChildComp {
  localText: string = '';

  @Input()
  set text(value: string) {
    PromiseWrapper.resolve(null).then((_) => { this.localText = value; });
  }
}

@Component({
  selector: 'async-change-comp',
  template: `<async-child-comp (click)='click()' [text]="text"></async-child-comp>`,
  directives: [AsyncChildComp]
})
class AsyncChangeComp {
  text: string = '1';

  click() { this.text += '1'; }
}

class FancyService {
  value: string = 'real value';
}

class MockFancyService extends FancyService {
  value: string = 'mocked out value';
}

@Component({
  selector: 'my-service-comp',
  bindings: [FancyService],
  template: `injected value: {{fancyService.value}}`
})
class TestBindingsComp {
  constructor(private fancyService: FancyService) {}
}

@Component({
  selector: 'my-service-comp',
  viewProviders: [FancyService],
  template: `injected value: {{fancyService.value}}`
})
class TestViewBindingsComp {
  constructor(private fancyService: FancyService) {}
}

@Component({selector: 'li1', template: `<span>One</span>`})
class ListDir1 {
}

@Component({selector: 'li1', template: `<span>Alternate One</span>`})
class ListDir1Alt {
}

@Component({selector: 'li2', template: `<span>Two</span>`})
class ListDir2 {
}

const LIST_CHILDREN = /*@ts2dart_const*/[ListDir1, ListDir2];

@Component(
    {selector: 'directive-list-comp', template: `(<li1></li1>)(<li2></li2>)`, directives: [LIST_CHILDREN]})
class DirectiveListComp {
}


export function main() {
  describe('test component builder', function() {
    it('should instantiate a component with valid DOM',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {

         tcb.createAsync(ChildComp).then((componentFixture) => {
           componentFixture.detectChanges();

           expect(componentFixture.nativeElement).toHaveText('Original Child');
           async.done();
         });
       }));

    it('should allow changing members of the component',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {

         tcb.createAsync(MyIfComp).then((componentFixture) => {
           componentFixture.detectChanges();
           expect(componentFixture.nativeElement).toHaveText('MyIf()');

           componentFixture.componentInstance.showMore = true;
           componentFixture.detectChanges();
           expect(componentFixture.nativeElement).toHaveText('MyIf(More)');

           async.done();
         });
       }));

    it('should override a template',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {

         tcb.overrideTemplate(MockChildComp, '<span>Mock</span>')
             .createAsync(MockChildComp)
             .then((componentFixture) => {
               componentFixture.detectChanges();
               expect(componentFixture.nativeElement).toHaveText('Mock');

               async.done();
             });
       }));

    it('should override a view',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {

         tcb.overrideView(ChildComp,
                          new ViewMetadata({template: '<span>Modified {{childBinding}}</span>'}))
             .createAsync(ChildComp)
             .then((componentFixture) => {
               componentFixture.detectChanges();
               expect(componentFixture.nativeElement).toHaveText('Modified Child');

               async.done();
             });
       }));

    it('should override component dependencies',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {

         tcb.overrideDirective(ParentComp, ChildComp, MockChildComp)
             .createAsync(ParentComp)
             .then((componentFixture) => {
               componentFixture.detectChanges();
               expect(componentFixture.nativeElement).toHaveText('Parent(Mock)');

               async.done();
             });
       }));

    it('should override items from a list',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {

         tcb.overrideDirective(DirectiveListComp, ListDir1, ListDir1Alt)
             .createAsync(DirectiveListComp)
             .then((componentFixture) => {
               componentFixture.detectChanges();
               expect(componentFixture.nativeElement).toHaveText('(Alternate One)(Two)');

               async.done();
             });
       }));

    it("should override child component's dependencies",
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {

         tcb.overrideDirective(ParentComp, ChildComp, ChildWithChildComp)
             .overrideDirective(ChildWithChildComp, ChildChildComp, MockChildChildComp)
             .createAsync(ParentComp)
             .then((componentFixture) => {
               componentFixture.detectChanges();
               expect(componentFixture.nativeElement)
                   .toHaveText('Parent(Original Child(ChildChild Mock))');

               async.done();
             });
       }));

    it('should override a provider',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {

         tcb.overrideProviders(TestBindingsComp,
                               [provide(FancyService, {useClass: MockFancyService})])
             .createAsync(TestBindingsComp)
             .then((componentFixture) => {
               componentFixture.detectChanges();
               expect(componentFixture.nativeElement)
                   .toHaveText('injected value: mocked out value');
               async.done();
             });
       }));


    it('should override a viewBinding',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {

         tcb.overrideViewProviders(TestViewBindingsComp,
                                   [provide(FancyService, {useClass: MockFancyService})])
             .createAsync(TestViewBindingsComp)
             .then((componentFixture) => {
               componentFixture.detectChanges();
               expect(componentFixture.nativeElement)
                   .toHaveText('injected value: mocked out value');
               async.done();
             });
       }));

    if (!IS_DART) {
      describe('ComponentFixture', () => {
        it('should auto detect changes if autoDetectChanges is called',
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {

                    tcb.createAsync(AutoDetectComp)
                        .then((componentFixture) => {
                          expect(componentFixture.ngZone).not.toBeNull();
                          componentFixture.autoDetectChanges();
                          expect(componentFixture.nativeElement).toHaveText('1');

                          let element = componentFixture.debugElement.children[0];
                          dispatchEvent(element.nativeElement, 'click');

                          expect(componentFixture.isStable()).toBe(true);
                          expect(componentFixture.nativeElement).toHaveText('11');
                          async.done();
                        });
                  }));

        it('should auto detect changes if ComponentFixtureAutoDetect is provided as true',
           withProviders(() => [provide(ComponentFixtureAutoDetect, {useValue: true})])
               .inject([TestComponentBuilder, AsyncTestCompleter],
                       (tcb: TestComponentBuilder, async) => {

                         tcb.createAsync(AutoDetectComp)
                             .then((componentFixture) => {
                               expect(componentFixture.nativeElement).toHaveText('1');

                               let element = componentFixture.debugElement.children[0];
                               dispatchEvent(element.nativeElement, 'click');

                               expect(componentFixture.nativeElement).toHaveText('11');
                               async.done();
                             });
                       }));

        it('should signal through whenStable when the fixture is stable (autoDetectChanges)',
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {

                    tcb.createAsync(AsyncComp).then((componentFixture) => {
                      componentFixture.autoDetectChanges();
                      expect(componentFixture.nativeElement).toHaveText('1');

                      let element = componentFixture.debugElement.children[0];
                      dispatchEvent(element.nativeElement, 'click');
                      expect(componentFixture.nativeElement).toHaveText('1');

                      // Component is updated asynchronously. Wait for the fixture to become stable
                      // before checking for new value.
                      expect(componentFixture.isStable()).toBe(false);
                      componentFixture.whenStable().then((waited) => {
                        expect(waited).toBe(true);
                        expect(componentFixture.nativeElement).toHaveText('11');
                        async.done();
                      });
                    });
                  }));

        it('should signal through isStable when the fixture is stable (no autoDetectChanges)',
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {

                    tcb.createAsync(AsyncComp).then((componentFixture) => {
                      componentFixture.detectChanges();
                      expect(componentFixture.nativeElement).toHaveText('1');

                      let element = componentFixture.debugElement.children[0];
                      dispatchEvent(element.nativeElement, 'click');
                      expect(componentFixture.nativeElement).toHaveText('1');

                      // Component is updated asynchronously. Wait for the fixture to become stable
                      // before checking.
                      componentFixture.whenStable().then((waited) => {
                        expect(waited).toBe(true);
                        componentFixture.detectChanges();
                        expect(componentFixture.nativeElement).toHaveText('11');
                        async.done();
                      });
                    });
                  }));

        it('should stabilize after async task in change detection (autoDetectChanges)',
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {

                    tcb.createAsync(AsyncChangeComp)
                        .then((componentFixture) => {
                          componentFixture.autoDetectChanges();
                          componentFixture.whenStable().then((_) => {
                            expect(componentFixture.nativeElement).toHaveText('1');

                            let element = componentFixture.debugElement.children[0];
                            dispatchEvent(element.nativeElement, 'click');

                            componentFixture.whenStable().then((_) => {
                              expect(componentFixture.nativeElement).toHaveText('11');
                              async.done();
                            });
                          });
                        });
                  }));

        it('should stabilize after async task in change detection(no autoDetectChanges)',
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {

                    tcb.createAsync(AsyncChangeComp)
                        .then((componentFixture) => {
                          componentFixture.detectChanges();
                          componentFixture.whenStable().then((_) => {
                            // Run detectChanges again so that stabilized value is reflected in the
                            // DOM.
                            componentFixture.detectChanges();
                            expect(componentFixture.nativeElement).toHaveText('1');

                            let element = componentFixture.debugElement.children[0];
                            dispatchEvent(element.nativeElement, 'click');
                            componentFixture.detectChanges();

                            componentFixture.whenStable().then((_) => {
                              // Run detectChanges again so that stabilized value is reflected in
                              // the DOM.
                              componentFixture.detectChanges();
                              expect(componentFixture.nativeElement).toHaveText('11');
                              async.done();
                            });
                          });
                        });
                  }));

        describe('No NgZone', () => {
          beforeEachProviders(() => [provide(ComponentFixtureNoNgZone, {useValue: true})]);

          it('calling autoDetectChanges raises an error', () => {
            inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder,
                                                                async) => {
              tcb.createAsync(ChildComp).then((componentFixture) => {
                expect(() => {
                  componentFixture.autoDetectChanges();
                }).toThrow('Cannot call autoDetectChanges when ComponentFixtureNoNgZone is set!!');
                async.done();
              });
            });
          });

          it('should instantiate a component with valid DOM',
             inject([TestComponentBuilder, AsyncTestCompleter],
                    (tcb: TestComponentBuilder, async) => {

                      tcb.createAsync(ChildComp).then((componentFixture) => {
                        expect(componentFixture.ngZone).toBeNull();
                        componentFixture.detectChanges();
                        expect(componentFixture.nativeElement).toHaveText('Original Child');
                        async.done();
                      });
                    }));

          it('should allow changing members of the component',
             inject([TestComponentBuilder, AsyncTestCompleter],
                    (tcb: TestComponentBuilder, async) => {

                      tcb.createAsync(MyIfComp).then((componentFixture) => {
                        componentFixture.detectChanges();
                        expect(componentFixture.nativeElement).toHaveText('MyIf()');

                        componentFixture.componentInstance.showMore = true;
                        componentFixture.detectChanges();
                        expect(componentFixture.nativeElement).toHaveText('MyIf(More)');

                        async.done();
                      });
                    }));
        });
      });
    }
  });
}
