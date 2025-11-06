import { workspace } from "vscode";
import { CONFIG_ID } from "./constants";

export type CollapsedBodyMode = "count" | "content" | "none";

export function collapsedBodyContent(): CollapsedBodyMode {
  const mode = workspace.getConfiguration(CONFIG_ID).get<CollapsedBodyMode>("collapsedBodyContent");
  return mode ?? "content";
}

export function collapsedMaxBodyLength() {
  return workspace.getConfiguration(CONFIG_ID).get<number>("collapsedMaxBodyLength") ?? 30;
}

export function foldClosingBrackets() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("foldClosingBrackets") ?? false;
}

export function foldClosingTags() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("foldClosingTags") ?? false;
}


export function showFoldedBrackets() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showFoldedBrackets") && foldClosingBrackets();
}

export function excludedLanguages() {
  return workspace.getConfiguration(CONFIG_ID).get<string[]>("excludedLanguages") ?? [];
}

export function showOnlyRegionsDescriptions() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showOnlyRegionsDescriptions") ?? false;
}

export function showFunctionParameters() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showFunctionParameters") && showFoldedBrackets();
}

export function chainFoldingRanges() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("chainFoldingRanges") && showFoldedBrackets();
}

export function showObjectPreviews() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showObjectPreviews") && showFoldedBrackets();
}
