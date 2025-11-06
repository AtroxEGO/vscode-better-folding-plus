import { TextDocument, Range } from "vscode";
import { BetterFoldingRange } from "../types";
import { parse } from "@typescript-eslint/typescript-estree";
import { JSXElement, BaseNode } from "@typescript-eslint/types/dist/generated/ast-spec";
import * as config from "../configuration";
import BetterFoldingRangeProvider from "./betterFoldingRangeProvider";

export default class JsxRangesProvider extends BetterFoldingRangeProvider {
  constructor() {
    super();
  }

  protected async calculateFoldingRanges(document: TextDocument) {
    const jsxElements: JSXElement[] = [];
    try {
      const ast = parse(document.getText(), { jsx: true, loc: true, range: true });
      this.visit(ast, jsxElements);

      return this.jsxElementsToFoldingRanges(jsxElements, document);
    } catch (e) {
      return this.provideFoldingRanges(document);
    }
  }

  private visit(node: unknown, jsxElements: JSXElement[]) {
    if (Array.isArray(node)) {
      for (const child of node) this.visit(child, jsxElements);
      return;
    }
    if (!this.isBaseNode(node)) return;

    if (node.loc.end.line - node.loc.start.line > 0) {
      for (const child of Object.values(node)) {
        this.visit(child, jsxElements);
      }
      if (this.isJsxElement(node)) {
        jsxElements.push(node);
      }
    }
  }

  private isBaseNode(node: unknown): node is BaseNode {
    return Boolean(node) && node!.hasOwnProperty("type");
  }

  private isJsxElement(node: BaseNode): node is JSXElement {
    return node.type === "JSXElement";
  }

  private async jsxElementsToFoldingRanges(
    jsxElements: JSXElement[],
    document: TextDocument
  ): Promise<BetterFoldingRange[]> {
    const foldingRanges: BetterFoldingRange[] = [];

    const foldClosingTags = config.foldClosingTags();

    for (const jsxElement of jsxElements) {
      const start = jsxElement.loc.start.line - 1;
      const end = jsxElement.loc.end.line - 1 - (foldClosingTags ? 0 : 1);

      const startColumn = this.getStartColumn(jsxElement);
      const collapsedText = this.getCollapsedText(jsxElement, document);

      foldingRanges.push({ start, end, startColumn, collapsedText });
    }

    return foldingRanges;
  }

  private getStartColumn(jsxElement: JSXElement): number | undefined {
    const hasAttributes = jsxElement.openingElement.attributes.length > 0;
    const nameEndColumn = jsxElement.openingElement.name.loc.end.column;
    const tagEndColumn = jsxElement.openingElement.loc.end.column;

    const startColumn = hasAttributes ? nameEndColumn : tagEndColumn;

    return startColumn;
  }

  private getCollapsedText(jsxElement: JSXElement, document: TextDocument): string {
    if (!jsxElement.closingElement) {
      return "…/>";
    }

    let collapsedText = "…";

    switch (config.collapsedBodyContent()) {
      case "count":
        collapsedText = this.getFoldedLinesCountCollapsedText(jsxElement);
        break;
      case "content":
        collapsedText = this.getFoldedContentPreview(jsxElement, document);
        break;
    }

    const hasAttributes = jsxElement.openingElement.attributes.length > 0;

    const foldClosingTags = config.foldClosingTags();
    const { start, end } = jsxElement.closingElement.loc;
    const closingElementRange = new Range(start.line - 1, start.column, end.line - 1, end.column);
    const closingElementText = document.getText(closingElementRange);

    return (hasAttributes ? "…>" : "") + collapsedText + (foldClosingTags ? closingElementText : "");
  }

  private getFoldedLinesCountCollapsedText(jsxElement: JSXElement): string {
    const linesCount = jsxElement.loc.end.line - jsxElement.loc.start.line - 1;
    return `… ${linesCount} lines …`;
  }

  private getFoldedContentPreview(jsxElement: JSXElement, document: TextDocument): string {
    const startLine = jsxElement.openingElement.loc.end.line - 1;
    const startCol = jsxElement.openingElement.loc.end.column;
    const endLine = jsxElement.closingElement!.loc.start.line - 1;
    const endCol = jsxElement.closingElement!.loc.start.column;

    const contentRange = new Range(startLine, startCol, endLine, endCol);
    let content = document.getText(contentRange).trim();

    content = content.replace(/\s+/g, ' ');

    const maxLength = config.collapsedMaxBodyLength();
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '…';
    }

    return content ? `… ${content} …` : '…';
  }
}
