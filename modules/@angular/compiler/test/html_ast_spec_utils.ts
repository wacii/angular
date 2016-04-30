import {HtmlParser, HtmlParseTreeResult, HtmlTreeError} from '@angular/compiler/src/html_parser';
import {
  HtmlAst,
  HtmlAstVisitor,
  HtmlElementAst,
  HtmlAttrAst,
  HtmlTextAst,
  HtmlCommentAst,
  HtmlExpansionAst,
  HtmlExpansionCaseAst,
  htmlVisitAll
} from '@angular/compiler/src/html_ast';
import {ParseError, ParseLocation} from '@angular/compiler/src/parse_util';
import {BaseException} from '../src/facade/exceptions';

export function humanizeDom(parseResult: HtmlParseTreeResult): any[] {
  if (parseResult.errors.length > 0) {
    var errorString = parseResult.errors.join('\n');
    throw new BaseException(`Unexpected parse errors:\n${errorString}`);
  }

  var humanizer = new _Humanizer(false);
  htmlVisitAll(humanizer, parseResult.rootNodes);
  return humanizer.result;
}

export function humanizeDomSourceSpans(parseResult: HtmlParseTreeResult): any[] {
  if (parseResult.errors.length > 0) {
    var errorString = parseResult.errors.join('\n');
    throw new BaseException(`Unexpected parse errors:\n${errorString}`);
  }

  var humanizer = new _Humanizer(true);
  htmlVisitAll(humanizer, parseResult.rootNodes);
  return humanizer.result;
}

export function humanizeLineColumn(location: ParseLocation): string {
  return `${location.line}:${location.col}`;
}

class _Humanizer implements HtmlAstVisitor {
  result: any[] = [];
  elDepth: number = 0;

  constructor(private includeSourceSpan: boolean){};

  visitElement(ast: HtmlElementAst, context: any): any {
    var res = this._appendContext(ast, [HtmlElementAst, ast.name, this.elDepth++]);
    this.result.push(res);
    htmlVisitAll(this, ast.attrs);
    htmlVisitAll(this, ast.children);
    this.elDepth--;
    return null;
  }

  visitAttr(ast: HtmlAttrAst, context: any): any {
    var res = this._appendContext(ast, [HtmlAttrAst, ast.name, ast.value]);
    this.result.push(res);
    return null;
  }

  visitText(ast: HtmlTextAst, context: any): any {
    var res = this._appendContext(ast, [HtmlTextAst, ast.value, this.elDepth]);
    this.result.push(res);
    return null;
  }

  visitComment(ast: HtmlCommentAst, context: any): any {
    var res = this._appendContext(ast, [HtmlCommentAst, ast.value, this.elDepth]);
    this.result.push(res);
    return null;
  }

  visitExpansion(ast: HtmlExpansionAst, context: any): any {
    var res = this._appendContext(ast, [HtmlExpansionAst, ast.switchValue, ast.type]);
    this.result.push(res);
    htmlVisitAll(this, ast.cases);
    return null;
  }

  visitExpansionCase(ast: HtmlExpansionCaseAst, context: any): any {
    var res = this._appendContext(ast, [HtmlExpansionCaseAst, ast.value]);
    this.result.push(res);
    return null;
  }

  private _appendContext(ast: HtmlAst, input: any[]): any[] {
    if (!this.includeSourceSpan) return input;
    input.push(ast.sourceSpan.toString());
    return input;
  }
}
