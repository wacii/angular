import {
  Component,
  Directive,
  Output,
  EventEmitter,
  Provider,
  forwardRef,
  Input
} from 'angular2/core';
import {
  ComponentFixture,
  afterEach,
  AsyncTestCompleter,
  TestComponentBuilder,
  beforeEach,
  ddescribe,
  describe,
  dispatchEvent,
  fakeAsync,
  tick,
  flushMicrotasks,
  expect,
  it,
  inject,
  iit,
  xit,
  browserDetection
} from 'angular2/testing_internal';

import {DOM} from 'angular2/src/platform/dom/dom_adapter';
import {
  Control,
  ControlGroup,
  ControlValueAccessor,
  FORM_DIRECTIVES,
  NG_VALIDATORS,
  NG_ASYNC_VALIDATORS,
  NgControl,
  NgIf,
  NgFor,
  NgForm,
  Validators,
  Validator,
  RadioButtonState
} from 'angular2/common';
import {By} from 'angular2/platform/browser';
import {ListWrapper} from 'angular2/src/facade/collection';
import {ObservableWrapper, TimerWrapper} from 'angular2/src/facade/async';
import {PromiseWrapper} from "angular2/src/facade/promise";

export function main() {
  describe("integration tests", () => {

    it("should initialize DOM elements with the given form object",
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var t = `<div [ngFormModel]="form">
                <input type="text" ngControl="login">
               </div>`;

         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
           fixture.debugElement.componentInstance.form =
               new ControlGroup({"login": new Control("loginValue")});
           fixture.detectChanges();

           var input = fixture.debugElement.query(By.css("input"));
           expect(input.nativeElement.value).toEqual("loginValue");
           async.done();
         });
       }));

    it("should throw if a form isn't passed into ngFormModel",
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var t = `<div [ngFormModel]="form">
                <input type="text" ngControl="login">
               </div>`;

         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
           expect(() => fixture.detectChanges())
               .toThrowError(new RegExp(`ngFormModel expects a form. Please pass one in.`));
           async.done();
         });
       }));

    it("should update the control group values on DOM change",
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var form = new ControlGroup({"login": new Control("oldValue")});

         var t = `<div [ngFormModel]="form">
                <input type="text" ngControl="login">
              </div>`;

         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
           fixture.debugElement.componentInstance.form = form;
           fixture.detectChanges();
           var input = fixture.debugElement.query(By.css("input"));

           input.nativeElement.value = "updatedValue";
           dispatchEvent(input.nativeElement, "input");

           expect(form.value).toEqual({"login": "updatedValue"});
           async.done();
         });
       }));

    it("should ignore the change event for <input type=text>",
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var form = new ControlGroup({"login": new Control("oldValue")});

         var t = `<div [ngFormModel]="form">
                <input type="text" ngControl="login">
              </div>`;

         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
           fixture.debugElement.componentInstance.form = form;
           fixture.detectChanges();
           var input = fixture.debugElement.query(By.css("input"));

           input.nativeElement.value = "updatedValue";

           ObservableWrapper.subscribe(form.valueChanges,
                                       (value) => { throw 'Should not happen'; });
           dispatchEvent(input.nativeElement, "change");

           async.done();
         });
       }));

    it("should emit ngSubmit event on submit",
       fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
         var t = `<div>
                      <form [ngFormModel]="form" (ngSubmit)="name='updated'"></form>
                      <span>{{name}}</span>
                    </div>`;

         var fixture: ComponentFixture;

         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
         tick();

         fixture.debugElement.componentInstance.form = new ControlGroup({});
         fixture.debugElement.componentInstance.name = 'old';

         tick();

         var form = fixture.debugElement.query(By.css("form"));
         dispatchEvent(form.nativeElement, "submit");

         tick();
         expect(fixture.debugElement.componentInstance.name).toEqual('updated');
       })));

    it("should work with single controls",
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var control = new Control("loginValue");

         var t = `<div><input type="text" [ngFormControl]="form"></div>`;

         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
           fixture.debugElement.componentInstance.form = control;
           fixture.detectChanges();

           var input = fixture.debugElement.query(By.css("input"));
           expect(input.nativeElement.value).toEqual("loginValue");

           input.nativeElement.value = "updatedValue";
           dispatchEvent(input.nativeElement, "input");

           expect(control.value).toEqual("updatedValue");
           async.done();
         });
       }));

    it("should update DOM elements when rebinding the control group",
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var t = `<div [ngFormModel]="form">
                <input type="text" ngControl="login">
               </div>`;

         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
           fixture.debugElement.componentInstance.form =
               new ControlGroup({"login": new Control("oldValue")});
           fixture.detectChanges();

           fixture.debugElement.componentInstance.form =
               new ControlGroup({"login": new Control("newValue")});
           fixture.detectChanges();

           var input = fixture.debugElement.query(By.css("input"));
           expect(input.nativeElement.value).toEqual("newValue");
           async.done();
         });
       }));

    it("should update DOM elements when updating the value of a control",
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var login = new Control("oldValue");
         var form = new ControlGroup({"login": login});

         var t = `<div [ngFormModel]="form">
                <input type="text" ngControl="login">
               </div>`;

         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
           fixture.debugElement.componentInstance.form = form;
           fixture.detectChanges();

           login.updateValue("newValue");

           fixture.detectChanges();

           var input = fixture.debugElement.query(By.css("input"));
           expect(input.nativeElement.value).toEqual("newValue");
           async.done();
         });
       }));

    it("should mark controls as touched after interacting with the DOM control",
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var login = new Control("oldValue");
         var form = new ControlGroup({"login": login});

         var t = `<div [ngFormModel]="form">
                <input type="text" ngControl="login">
               </div>`;

         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
           fixture.debugElement.componentInstance.form = form;
           fixture.detectChanges();

           var loginEl = fixture.debugElement.query(By.css("input"));
           expect(login.touched).toBe(false);

           dispatchEvent(loginEl.nativeElement, "blur");

           expect(login.touched).toBe(true);

           async.done();
         });
       }));

    describe("different control types", () => {
      it("should support <input type=text>",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<div [ngFormModel]="form">
                  <input type="text" ngControl="text">
                </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form =
                 new ControlGroup({"text": new Control("old")});
             fixture.detectChanges();

             var input = fixture.debugElement.query(By.css("input"));
             expect(input.nativeElement.value).toEqual("old");

             input.nativeElement.value = "new";
             dispatchEvent(input.nativeElement, "input");

             expect(fixture.debugElement.componentInstance.form.value).toEqual({"text": "new"});
             async.done();
           });
         }));

      it("should support <input> without type",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<div [ngFormModel]="form">
                  <input ngControl="text">
                </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form =
                 new ControlGroup({"text": new Control("old")});
             fixture.detectChanges();
             var input = fixture.debugElement.query(By.css("input"));
             expect(input.nativeElement.value).toEqual("old");

             input.nativeElement.value = "new";
             dispatchEvent(input.nativeElement, "input");

             expect(fixture.debugElement.componentInstance.form.value).toEqual({"text": "new"});
             async.done();
           });
         }));

      it("should support <textarea>",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<div [ngFormModel]="form">
                  <textarea ngControl="text"></textarea>
                </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form =
                 new ControlGroup({"text": new Control('old')});
             fixture.detectChanges();

             var textarea = fixture.debugElement.query(By.css("textarea"));
             expect(textarea.nativeElement.value).toEqual("old");

             textarea.nativeElement.value = "new";
             dispatchEvent(textarea.nativeElement, "input");

             expect(fixture.debugElement.componentInstance.form.value).toEqual({"text": 'new'});
             async.done();
           });
         }));

      it("should support <type=checkbox>",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<div [ngFormModel]="form">
                  <input type="checkbox" ngControl="checkbox">
                </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form =
                 new ControlGroup({"checkbox": new Control(true)});
             fixture.detectChanges();

             var input = fixture.debugElement.query(By.css("input"));
             expect(input.nativeElement.checked).toBe(true);

             input.nativeElement.checked = false;
             dispatchEvent(input.nativeElement, "change");

             expect(fixture.debugElement.componentInstance.form.value).toEqual({"checkbox": false});
             async.done();
           });
         }));

      it("should support <type=number>",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<div [ngFormModel]="form">
                  <input type="number" ngControl="num">
                </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form =
                 new ControlGroup({"num": new Control(10)});
             fixture.detectChanges();

             var input = fixture.debugElement.query(By.css("input"));
             expect(input.nativeElement.value).toEqual("10");

             input.nativeElement.value = "20";
             dispatchEvent(input.nativeElement, "input");

             expect(fixture.debugElement.componentInstance.form.value).toEqual({"num": 20});
             async.done();
           });
         }));

      it("should support <type=number> when value is cleared in the UI",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<div [ngFormModel]="form">
                  <input type="number" ngControl="num" required>
                </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form =
                 new ControlGroup({"num": new Control(10)});
             fixture.detectChanges();

             var input = fixture.debugElement.query(By.css("input"));
             input.nativeElement.value = "";
             dispatchEvent(input.nativeElement, "input");

             expect(fixture.debugElement.componentInstance.form.valid).toBe(false);
             expect(fixture.debugElement.componentInstance.form.value).toEqual({"num": null});

             input.nativeElement.value = "0";
             dispatchEvent(input.nativeElement, "input");

             expect(fixture.debugElement.componentInstance.form.valid).toBe(true);
             expect(fixture.debugElement.componentInstance.form.value).toEqual({"num": 0});
             async.done();
           });
         }));


      it("should support <type=number> when value is cleared programmatically",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var form = new ControlGroup({"num": new Control(10)});
           var t = `<div [ngFormModel]="form">
                  <input type="number" ngControl="num" [(ngModel)]="data">
                </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form = form;
             fixture.debugElement.componentInstance.data = null;
             fixture.detectChanges();

             var input = fixture.debugElement.query(By.css("input"));
             expect(input.nativeElement.value).toEqual("");

             async.done();
           });
         }));

      it("should support <type=radio>",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<form [ngFormModel]="form">
                  <input type="radio" ngControl="foodChicken" name="food">
                  <input type="radio" ngControl="foodFish" name="food">
                </form>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form = new ControlGroup({
               "foodChicken": new Control(new RadioButtonState(false, 'chicken')),
               "foodFish": new Control(new RadioButtonState(true, 'fish'))
             });
             fixture.detectChanges();

             var input = fixture.debugElement.query(By.css("input"));
             expect(input.nativeElement.checked).toEqual(false);

             dispatchEvent(input.nativeElement, "change");
             fixture.detectChanges();

             let value = fixture.debugElement.componentInstance.form.value;
             expect(value['foodChicken'].checked).toEqual(true);
             expect(value['foodFish'].checked).toEqual(false);
             async.done();
           });
         }));

      describe("should support <select>", () => {
        it("with basic selection",
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {
                    var t = `<select>
                      <option value="SF"></option>
                      <option value="NYC"></option>
                    </select>`;

                    tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
                      fixture.detectChanges();

                      var select = fixture.debugElement.query(By.css("select"));
                      var sfOption = fixture.debugElement.query(By.css("option"));

                      expect(select.nativeElement.value).toEqual("SF");
                      expect(sfOption.nativeElement.selected).toBe(true);
                      async.done();
                    });
                  }));

        it("with basic selection and value bindings",
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {
                    var t = `<select>
                      <option *ngFor="let city of list" [value]="city['id']">
                        {{ city['name'] }}
                      </option>
                    </select>`;

                    tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
                      var testComp = fixture.debugElement.componentInstance;
                      testComp.list = [{"id": "0", "name": "SF"}, {"id": "1", "name": "NYC"}];
                      fixture.detectChanges();

                      var sfOption = fixture.debugElement.query(By.css("option"));
                      expect(sfOption.nativeElement.value).toEqual('0');

                      testComp.list[0]['id'] = '2';
                      fixture.detectChanges();
                      expect(sfOption.nativeElement.value).toEqual('2');
                      async.done();
                    });
                  }));

        it("with ngControl",
           inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder,
                                                               async) => {
             var t = `<div [ngFormModel]="form">
                    <select ngControl="city">
                      <option value="SF"></option>
                      <option value="NYC"></option>
                    </select>
                  </div>`;

             tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
               fixture.debugElement.componentInstance.form =
                   new ControlGroup({"city": new Control("SF")});
               fixture.detectChanges();

               var select = fixture.debugElement.query(By.css("select"));
               var sfOption = fixture.debugElement.query(By.css("option"));


               expect(select.nativeElement.value).toEqual("SF");
               expect(sfOption.nativeElement.selected).toBe(true);

               select.nativeElement.value = "NYC";
               dispatchEvent(select.nativeElement, "change");

               expect(fixture.debugElement.componentInstance.form.value).toEqual({"city": 'NYC'});
               expect(sfOption.nativeElement.selected).toBe(false);
               async.done();
             });
           }));

        it("with a dynamic list of options",
           fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
             var t = `<div [ngFormModel]="form">
                      <select ngControl="city">
                        <option *ngFor="let c of data" [value]="c"></option>
                      </select>
                  </div>`;

             var fixture;
             tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((compFixture) => fixture =
                                                                          compFixture);
             tick();

             fixture.debugElement.componentInstance.form =
                 new ControlGroup({"city": new Control("NYC")});

             fixture.debugElement.componentInstance.data = ['SF', 'NYC'];
             fixture.detectChanges();
             tick();

             var select = fixture.debugElement.query(By.css("select"));
             expect(select.nativeElement.value).toEqual("NYC");
           })));

        it("with option values that are objects",
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {
                    var t = `<div>
                      <select [(ngModel)]="selectedCity">
                        <option *ngFor="let c of list" [ngValue]="c">{{c['name']}}</option>
                      </select>
                  </div>`;

                    tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {

                      var testComp = fixture.debugElement.componentInstance;
                      testComp.list = [{"name": "SF"}, {"name": "NYC"}, {"name": "Buffalo"}];
                      testComp.selectedCity = testComp.list[1];
                      fixture.detectChanges();

                      var select = fixture.debugElement.query(By.css("select"));
                      var nycOption = fixture.debugElement.queryAll(By.css("option"))[1];

                      expect(select.nativeElement.value).toEqual("1: Object");
                      expect(nycOption.nativeElement.selected).toBe(true);

                      select.nativeElement.value = "2: Object";
                      dispatchEvent(select.nativeElement, "change");
                      fixture.detectChanges();
                      TimerWrapper.setTimeout(() => {
                        expect(testComp.selectedCity['name']).toEqual("Buffalo");
                        async.done();
                      }, 0);
                    });
                  }));

        it("when new options are added",
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {
                    var t = `<div>
                      <select [(ngModel)]="selectedCity">
                        <option *ngFor="let c of list" [ngValue]="c">{{c['name']}}</option>
                      </select>
                  </div>`;

                    tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {

                      var testComp: MyComp = fixture.debugElement.componentInstance;
                      testComp.list = [{"name": "SF"}, {"name": "NYC"}];
                      testComp.selectedCity = testComp.list[1];
                      fixture.detectChanges();

                      testComp.list.push({"name": "Buffalo"});
                      testComp.selectedCity = testComp.list[2];
                      fixture.detectChanges();

                      var select = fixture.debugElement.query(By.css("select"));
                      var buffalo = fixture.debugElement.queryAll(By.css("option"))[2];
                      expect(select.nativeElement.value).toEqual("2: Object");
                      expect(buffalo.nativeElement.selected).toBe(true);
                      async.done();
                    });
                  }));

        it("when options are removed",
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {
                    var t = `<div>
                      <select [(ngModel)]="selectedCity">
                        <option *ngFor="let c of list" [ngValue]="c">{{c}}</option>
                      </select>
                  </div>`;
                    tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {

                      var testComp: MyComp = fixture.debugElement.componentInstance;
                      testComp.list = [{"name": "SF"}, {"name": "NYC"}];
                      testComp.selectedCity = testComp.list[1];
                      fixture.detectChanges();

                      var select = fixture.debugElement.query(By.css("select"));
                      expect(select.nativeElement.value).toEqual("1: Object");

                      testComp.list.pop();
                      fixture.detectChanges();

                      expect(select.nativeElement.value).not.toEqual("1: Object");
                      async.done();
                    });
                  }));

        it("when option values change identity while tracking by index",
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {
                    var t = `<div>
                      <select [(ngModel)]="selectedCity">
                        <option *ngFor="let c of list; trackBy:customTrackBy" [ngValue]="c">{{c}}</option>
                      </select>
                  </div>`;

                    tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {

                      var testComp = fixture.debugElement.componentInstance;

                      testComp.list = [{"name": "SF"}, {"name": "NYC"}];
                      testComp.selectedCity = testComp.list[0];
                      fixture.detectChanges();

                      testComp.list[1] = "Buffalo";
                      testComp.selectedCity = testComp.list[1];
                      fixture.detectChanges();

                      var select = fixture.debugElement.query(By.css("select"));
                      var buffalo = fixture.debugElement.queryAll(By.css("option"))[1];

                      expect(select.nativeElement.value).toEqual("1: Buffalo");
                      expect(buffalo.nativeElement.selected).toBe(true);
                      async.done();
                    });
                  }));

        it("with duplicate option values",
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {
                    var t = `<div>
                      <select [(ngModel)]="selectedCity">
                        <option *ngFor="let c of list" [ngValue]="c">{{c}}</option>
                      </select>
                  </div>`;

                    tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {

                      var testComp = fixture.debugElement.componentInstance;

                      testComp.list = [{"name": "NYC"}, {"name": "SF"}, {"name": "SF"}];
                      testComp.selectedCity = testComp.list[0];
                      fixture.detectChanges();

                      testComp.selectedCity = testComp.list[1];
                      fixture.detectChanges();

                      var select = fixture.debugElement.query(By.css("select"));
                      var firstSF = fixture.debugElement.queryAll(By.css("option"))[1];

                      expect(select.nativeElement.value).toEqual("1: Object");
                      expect(firstSF.nativeElement.selected).toBe(true);
                      async.done();
                    });
                  }));

        it("when option values have same content, but different identities",
           inject([TestComponentBuilder, AsyncTestCompleter],
                  (tcb: TestComponentBuilder, async) => {
                    var t = `<div>
                      <select [(ngModel)]="selectedCity">
                        <option *ngFor="let c of list" [ngValue]="c">{{c['name']}}</option>
                      </select>
                  </div>`;

                    tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {

                      var testComp = fixture.debugElement.componentInstance;
                      testComp.list = [{"name": "SF"}, {"name": "NYC"}, {"name": "NYC"}];
                      testComp.selectedCity = testComp.list[0];
                      fixture.detectChanges();

                      testComp.selectedCity = testComp.list[2];
                      fixture.detectChanges();

                      var select = fixture.debugElement.query(By.css("select"));
                      var secondNYC = fixture.debugElement.queryAll(By.css("option"))[2];

                      expect(select.nativeElement.value).toEqual("2: Object");
                      expect(secondNYC.nativeElement.selected).toBe(true);
                      async.done();
                    });
                  }));
      });

      it("should support custom value accessors",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<div [ngFormModel]="form">
                  <input type="text" ngControl="name" wrapped-value>
                </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form =
                 new ControlGroup({"name": new Control("aa")});
             fixture.detectChanges();
             var input = fixture.debugElement.query(By.css("input"));
             expect(input.nativeElement.value).toEqual("!aa!");

             input.nativeElement.value = "!bb!";
             dispatchEvent(input.nativeElement, "input");

             expect(fixture.debugElement.componentInstance.form.value).toEqual({"name": "bb"});
             async.done();
           });
         }));

      it("should support custom value accessors on non builtin input elements that fire a change event without a 'target' property",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<div [ngFormModel]="form">
                  <my-input ngControl="name"></my-input>
                </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form =
                 new ControlGroup({"name": new Control("aa")});
             fixture.detectChanges();
             var input = fixture.debugElement.query(By.css("my-input"));
             expect(input.componentInstance.value).toEqual("!aa!");

             input.componentInstance.value = "!bb!";
             ObservableWrapper.subscribe(input.componentInstance.onInput, (value) => {
               expect(fixture.debugElement.componentInstance.form.value).toEqual({"name": "bb"});
               async.done();
             });
             input.componentInstance.dispatchChangeEvent();
           });
         }));

    });

    describe("validations", () => {
      it("should use sync validators defined in html",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var form = new ControlGroup(
               {"login": new Control(""), "min": new Control(""), "max": new Control("")});

           var t = `<div [ngFormModel]="form" login-is-empty-validator>
                    <input type="text" ngControl="login" required>
                    <input type="text" ngControl="min" minlength="3">
                    <input type="text" ngControl="max" maxlength="3">
                 </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form = form;
             fixture.detectChanges();

             var required = fixture.debugElement.query(By.css("[required]"));
             var minLength = fixture.debugElement.query(By.css("[minlength]"));
             var maxLength = fixture.debugElement.query(By.css("[maxlength]"));

             required.nativeElement.value = "";
             minLength.nativeElement.value = "1";
             maxLength.nativeElement.value = "1234";
             dispatchEvent(required.nativeElement, "input");
             dispatchEvent(minLength.nativeElement, "input");
             dispatchEvent(maxLength.nativeElement, "input");

             expect(form.hasError("required", ["login"])).toEqual(true);
             expect(form.hasError("minlength", ["min"])).toEqual(true);
             expect(form.hasError("maxlength", ["max"])).toEqual(true);

             expect(form.hasError("loginIsEmpty")).toEqual(true);

             required.nativeElement.value = "1";
             minLength.nativeElement.value = "123";
             maxLength.nativeElement.value = "123";
             dispatchEvent(required.nativeElement, "input");
             dispatchEvent(minLength.nativeElement, "input");
             dispatchEvent(maxLength.nativeElement, "input");

             expect(form.valid).toEqual(true);

             async.done();
           });
         }));

      it("should use async validators defined in the html",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var form = new ControlGroup({"login": new Control("")});

           var t = `<div [ngFormModel]="form">
                    <input type="text" ngControl="login" uniq-login-validator="expected">
                 </div>`;

           var rootTC;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => rootTC = root);
           tick();

           rootTC.debugElement.componentInstance.form = form;
           rootTC.detectChanges();

           expect(form.pending).toEqual(true);

           tick(100);

           expect(form.hasError("uniqLogin", ["login"])).toEqual(true);

           var input = rootTC.debugElement.query(By.css("input"));
           input.nativeElement.value = "expected";
           dispatchEvent(input.nativeElement, "input");
           tick(100);

           expect(form.valid).toEqual(true);
         })));

      it("should use sync validators defined in the model",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var form = new ControlGroup({"login": new Control("aa", Validators.required)});

           var t = `<div [ngFormModel]="form">
                  <input type="text" ngControl="login">
                 </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form = form;
             fixture.detectChanges();
             expect(form.valid).toEqual(true);

             var input = fixture.debugElement.query(By.css("input"));

             input.nativeElement.value = "";
             dispatchEvent(input.nativeElement, "input");

             expect(form.valid).toEqual(false);
             async.done();
           });
         }));

      it("should use async validators defined in the model",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var control = new Control("", Validators.required, uniqLoginAsyncValidator("expected"));
           var form = new ControlGroup({"login": control});

           var t = `<div [ngFormModel]="form">
                  <input type="text" ngControl="login">
                 </div>`;

           var fixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => fixture = root);
           tick();

           fixture.debugElement.componentInstance.form = form;
           fixture.detectChanges();

           expect(form.hasError("required", ["login"])).toEqual(true);

           var input = fixture.debugElement.query(By.css("input"));
           input.nativeElement.value = "wrong value";
           dispatchEvent(input.nativeElement, "input");

           expect(form.pending).toEqual(true);
           tick();

           expect(form.hasError("uniqLogin", ["login"])).toEqual(true);

           input.nativeElement.value = "expected";
           dispatchEvent(input.nativeElement, "input");
           tick();

           expect(form.valid).toEqual(true);
         })));
    });

    describe("nested forms", () => {
      it("should init DOM with the given form object",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var form =
               new ControlGroup({"nested": new ControlGroup({"login": new Control("value")})});

           var t = `<div [ngFormModel]="form">
                  <div ngControlGroup="nested">
                    <input type="text" ngControl="login">
                  </div>
              </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form = form;
             fixture.detectChanges();

             var input = fixture.debugElement.query(By.css("input"));
             expect(input.nativeElement.value).toEqual("value");
             async.done();
           });
         }));

      it("should update the control group values on DOM change",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var form =
               new ControlGroup({"nested": new ControlGroup({"login": new Control("value")})});

           var t = `<div [ngFormModel]="form">
                    <div ngControlGroup="nested">
                      <input type="text" ngControl="login">
                    </div>
                </div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form = form;
             fixture.detectChanges();
             var input = fixture.debugElement.query(By.css("input"));

             input.nativeElement.value = "updatedValue";
             dispatchEvent(input.nativeElement, "input");

             expect(form.value).toEqual({"nested": {"login": "updatedValue"}});
             async.done();
           });
         }));
    });

    it("should support ngModel for complex forms",
       fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
         var form = new ControlGroup({"name": new Control("")});

         var t =
             `<div [ngFormModel]="form"><input type="text" ngControl="name" [(ngModel)]="name"></div>`;

         var fixture: ComponentFixture;
         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
         tick();

         fixture.debugElement.componentInstance.name = 'oldValue';
         fixture.debugElement.componentInstance.form = form;
         fixture.detectChanges();

         var input = fixture.debugElement.query(By.css("input")).nativeElement;
         expect(input.value).toEqual("oldValue");

         input.value = "updatedValue";
         dispatchEvent(input, "input");

         tick();
         expect(fixture.debugElement.componentInstance.name).toEqual("updatedValue");
       })));

    it("should support ngModel for single fields",
       fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
         var form = new Control("");

         var t = `<div><input type="text" [ngFormControl]="form" [(ngModel)]="name"></div>`;

         var fixture: ComponentFixture;
         tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
         tick();
         fixture.debugElement.componentInstance.form = form;
         fixture.debugElement.componentInstance.name = "oldValue";
         fixture.detectChanges();

         var input = fixture.debugElement.query(By.css("input")).nativeElement;
         expect(input.value).toEqual("oldValue");

         input.value = "updatedValue";
         dispatchEvent(input, "input");
         tick();

         expect(fixture.debugElement.componentInstance.name).toEqual("updatedValue");
       })));

    describe("template-driven forms", () => {
      it("should add new controls and control groups",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var t = `<form>
                     <div ngControlGroup="user">
                      <input type="text" ngControl="login">
                     </div>
               </form>`;

           var fixture: ComponentFixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
           tick();
           fixture.debugElement.componentInstance.name = null;
           fixture.detectChanges();

           var form = fixture.debugElement.children[0].inject(NgForm);
           expect(form.controls['user']).not.toBeDefined();

           tick();

           expect(form.controls['user']).toBeDefined();
           expect(form.controls['user'].controls['login']).toBeDefined();
         })));

      it("should emit ngSubmit event on submit",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var t = `<div><form (ngSubmit)="name='updated'"></form></div>`;

           var fixture: ComponentFixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
           tick();
           fixture.debugElement.componentInstance.name = 'old';
           var form = fixture.debugElement.query(By.css("form"));

           dispatchEvent(form.nativeElement, "submit");
           tick();

           expect(fixture.debugElement.componentInstance.name).toEqual("updated");
         })));

      it("should not create a template-driven form when ngNoForm is used",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<form ngNoForm>
               </form>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.name = null;
             fixture.detectChanges();

             expect(fixture.debugElement.children[0].providerTokens.length).toEqual(0);
             async.done();
           });
         }));

      it("should remove controls",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var t = `<form>
                    <div *ngIf="name == 'show'">
                      <input type="text" ngControl="login">
                    </div>
                  </form>`;

           var fixture: ComponentFixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
           tick();
           fixture.debugElement.componentInstance.name = 'show';
           fixture.detectChanges();
           tick();
           var form = fixture.debugElement.children[0].inject(NgForm);


           expect(form.controls['login']).toBeDefined();

           fixture.debugElement.componentInstance.name = 'hide';
           fixture.detectChanges();
           tick();

           expect(form.controls['login']).not.toBeDefined();
         })));

      it("should remove control groups",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var t = `<form>
                     <div *ngIf="name=='show'" ngControlGroup="user">
                      <input type="text" ngControl="login">
                     </div>
               </form>`;


           var fixture: ComponentFixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
           tick();
           fixture.debugElement.componentInstance.name = 'show';
           fixture.detectChanges();
           tick();
           var form = fixture.debugElement.children[0].inject(NgForm);

           expect(form.controls['user']).toBeDefined();

           fixture.debugElement.componentInstance.name = 'hide';
           fixture.detectChanges();
           tick();

           expect(form.controls['user']).not.toBeDefined();
         })));

      it("should support ngModel for complex forms",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var t = `<form>
                      <input type="text" ngControl="name" [(ngModel)]="name">
               </form>`;

           var fixture: ComponentFixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
           tick();
           fixture.debugElement.componentInstance.name = "oldValue";
           fixture.detectChanges();
           tick();

           var input = fixture.debugElement.query(By.css("input")).nativeElement;
           expect(input.value).toEqual("oldValue");

           input.value = "updatedValue";
           dispatchEvent(input, "input");
           tick();

           expect(fixture.debugElement.componentInstance.name).toEqual("updatedValue");
         })));


      it("should support ngModel for single fields",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var t = `<div><input type="text" [(ngModel)]="name"></div>`;

           var fixture: ComponentFixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
           tick();
           fixture.debugElement.componentInstance.name = "oldValue";
           fixture.detectChanges();

           var input = fixture.debugElement.query(By.css("input")).nativeElement;
           expect(input.value).toEqual("oldValue");

           input.value = "updatedValue";
           dispatchEvent(input, "input");
           tick();

           expect(fixture.debugElement.componentInstance.name).toEqual("updatedValue");
         })));


      it("should support <type=radio>",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var t = `<form>
                  <input type="radio" name="food" ngControl="chicken" [(ngModel)]="data['chicken1']">
                  <input type="radio" name="food" ngControl="fish" [(ngModel)]="data['fish1']">
                </form>
                <form>
                  <input type="radio" name="food" ngControl="chicken" [(ngModel)]="data['chicken2']">
                  <input type="radio" name="food" ngControl="fish" [(ngModel)]="data['fish2']">
                </form>`;

           var fixture: ComponentFixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((f) => { fixture = f; });
           tick();

           fixture.debugElement.componentInstance.data = {
             'chicken1': new RadioButtonState(false, 'chicken'),
             'fish1': new RadioButtonState(true, 'fish'),

             'chicken2': new RadioButtonState(false, 'chicken'),
             'fish2': new RadioButtonState(true, 'fish')
           };
           fixture.detectChanges();
           tick();

           var input = fixture.debugElement.query(By.css("input"));
           expect(input.nativeElement.checked).toEqual(false);

           dispatchEvent(input.nativeElement, "change");
           tick();

           let data = fixture.debugElement.componentInstance.data;

           expect(data['chicken1']).toEqual(new RadioButtonState(true, 'chicken'));
           expect(data['fish1']).toEqual(new RadioButtonState(false, 'fish'));

           expect(data['chicken2']).toEqual(new RadioButtonState(false, 'chicken'));
           expect(data['fish2']).toEqual(new RadioButtonState(true, 'fish'));
         })));
    });

    describe("setting status classes", () => {
      it("should work with single fields",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var form = new Control("", Validators.required);

           var t = `<div><input type="text" [ngFormControl]="form"></div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form = form;
             fixture.detectChanges();

             var input = fixture.debugElement.query(By.css("input")).nativeElement;
             expect(sortedClassList(input)).toEqual(['ng-invalid', 'ng-pristine', 'ng-untouched']);

             dispatchEvent(input, "blur");
             fixture.detectChanges();

             expect(sortedClassList(input)).toEqual(["ng-invalid", "ng-pristine", "ng-touched"]);

             input.value = "updatedValue";
             dispatchEvent(input, "input");
             fixture.detectChanges();

             expect(sortedClassList(input)).toEqual(["ng-dirty", "ng-touched", "ng-valid"]);
             async.done();
           });
         }));

      it("should work with complex model-driven forms",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var form = new ControlGroup({"name": new Control("", Validators.required)});

           var t = `<form [ngFormModel]="form"><input type="text" ngControl="name"></form>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.form = form;
             fixture.detectChanges();

             var input = fixture.debugElement.query(By.css("input")).nativeElement;
             expect(sortedClassList(input)).toEqual(["ng-invalid", "ng-pristine", "ng-untouched"]);

             dispatchEvent(input, "blur");
             fixture.detectChanges();

             expect(sortedClassList(input)).toEqual(["ng-invalid", "ng-pristine", "ng-touched"]);

             input.value = "updatedValue";
             dispatchEvent(input, "input");
             fixture.detectChanges();

             expect(sortedClassList(input)).toEqual(["ng-dirty", "ng-touched", "ng-valid"]);
             async.done();
           });
         }));

      it("should work with ngModel",
         inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
           var t = `<div><input [(ngModel)]="name" required></div>`;

           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((fixture) => {
             fixture.debugElement.componentInstance.name = "";
             fixture.detectChanges();

             var input = fixture.debugElement.query(By.css("input")).nativeElement;
             expect(sortedClassList(input)).toEqual(["ng-invalid", "ng-pristine", "ng-untouched"]);

             dispatchEvent(input, "blur");
             fixture.detectChanges();

             expect(sortedClassList(input)).toEqual(["ng-invalid", "ng-pristine", "ng-touched"]);

             input.value = "updatedValue";
             dispatchEvent(input, "input");
             fixture.detectChanges();

             expect(sortedClassList(input)).toEqual(["ng-dirty", "ng-touched", "ng-valid"]);
             async.done();
           });
         }));
    });

    describe("ngModel corner cases", () => {
      it("should not update the view when the value initially came from the view",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var form = new Control("");

           var t = `<div><input type="text" [ngFormControl]="form" [(ngModel)]="name"></div>`;
           var fixture: ComponentFixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
           tick();
           fixture.debugElement.componentInstance.form = form;
           fixture.detectChanges();

           // In Firefox, effective text selection in the real DOM requires an actual focus
           // of the field. This is not an issue in a new HTML document.
           if (browserDetection.isFirefox) {
             var fakeDoc = DOM.createHtmlDocument();
             DOM.appendChild(fakeDoc.body, fixture.debugElement.nativeElement);
           }

           var input = fixture.debugElement.query(By.css("input")).nativeElement;
           input.value = "aa";
           input.selectionStart = 1;
           dispatchEvent(input, "input");

           tick();
           fixture.detectChanges();

           // selection start has not changed because we did not reset the value
           expect(input.selectionStart).toEqual(1);
         })));

      it("should update the view when the model is set back to what used to be in the view",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           var t = `<input type="text" [(ngModel)]="name">`;
           var fixture: ComponentFixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
           tick();
           fixture.debugElement.componentInstance.name = "";
           fixture.detectChanges();

           // Type "aa" into the input.
           var input = fixture.debugElement.query(By.css("input")).nativeElement;
           input.value = "aa";
           input.selectionStart = 1;
           dispatchEvent(input, "input");

           tick();
           fixture.detectChanges();
           expect(fixture.debugElement.componentInstance.name).toEqual("aa");

           // Programatically update the input value to be "bb".
           fixture.debugElement.componentInstance.name = "bb";
           tick();
           fixture.detectChanges();
           expect(input.value).toEqual("bb");

           // Programatically set it back to "aa".
           fixture.debugElement.componentInstance.name = "aa";
           tick();
           fixture.detectChanges();
           expect(input.value).toEqual("aa");
         })));
      it("should not crash when validity is checked from a binding",
         fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           // {{x.valid}} used to crash because valid() tried to read a property
           // from form.control before it was set. This test verifies this bug is
           // fixed.
           var t = `<form><div ngControlGroup="x" #x="ngForm">
                  <input type="text" ngControl="test"></div>{{x.valid}}</form>`;
           var fixture: ComponentFixture;
           tcb.overrideTemplate(MyComp, t).createAsync(MyComp).then((root) => { fixture = root; });
           tick();
           fixture.detectChanges();
         })));
    });
  });
}

@Directive({
  selector: '[wrapped-value]',
  host: {'(input)': 'handleOnInput($event.target.value)', '[value]': 'value'}
})
class WrappedValue implements ControlValueAccessor {
  value;
  onChange: Function;

  constructor(cd: NgControl) { cd.valueAccessor = this; }

  writeValue(value) { this.value = `!${value}!`; }

  registerOnChange(fn) { this.onChange = fn; }
  registerOnTouched(fn) {}

  handleOnInput(value) { this.onChange(value.substring(1, value.length - 1)); }
}

@Component({selector: "my-input", template: ''})
class MyInput implements ControlValueAccessor {
  @Output('input') onInput: EventEmitter<any> = new EventEmitter();
  value: string;

  constructor(cd: NgControl) { cd.valueAccessor = this; }

  writeValue(value) { this.value = `!${value}!`; }

  registerOnChange(fn) { ObservableWrapper.subscribe(this.onInput, fn); }

  registerOnTouched(fn) {}

  dispatchChangeEvent() {
    ObservableWrapper.callEmit(this.onInput, this.value.substring(1, this.value.length - 1));
  }
}

function uniqLoginAsyncValidator(expectedValue: string) {
  return (c) => {
    var completer = PromiseWrapper.completer();
    var res = (c.value == expectedValue) ? null : {"uniqLogin": true};
    completer.resolve(res);
    return completer.promise;
  };
}

function loginIsEmptyGroupValidator(c: ControlGroup) {
  return c.controls["login"].value == "" ? {"loginIsEmpty": true} : null;
}

@Directive({
  selector: '[login-is-empty-validator]',
  providers: [
    /* @ts2dart_Provider */ {
      provide: NG_VALIDATORS,
      useValue: loginIsEmptyGroupValidator,
      multi: true
    }
  ]
})
class LoginIsEmptyValidator {
}

@Directive({
  selector: '[uniq-login-validator]',
  providers: [
    new Provider(NG_ASYNC_VALIDATORS,
                 {useExisting: forwardRef(() => UniqLoginValidator), multi: true})
  ]
})
class UniqLoginValidator implements Validator {
  @Input('uniq-login-validator') expected;

  validate(c) { return uniqLoginAsyncValidator(this.expected)(c); }
}

@Component({
  selector: "my-comp",
  template: '',
  directives: [
    FORM_DIRECTIVES,
    WrappedValue,
    MyInput,
    NgIf,
    NgFor,
    LoginIsEmptyValidator,
    UniqLoginValidator
  ]
})
class MyComp {
  form: any;
  name: string;
  data: any;
  list: any[];
  selectedCity: any;
  customTrackBy(index: number, obj: any): number { return index; };
}

function sortedClassList(el) {
  var l = DOM.classList(el);
  ListWrapper.sort(l);
  return l;
}
