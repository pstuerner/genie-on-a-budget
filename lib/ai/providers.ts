import {
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { openai } from "@ai-sdk/openai";

const THINKING_SUFFIX_REGEX = /-thinking$/;

export function getLanguageModel(modelId: string) {
  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    const modelIdToUse = modelId.replace(THINKING_SUFFIX_REGEX, "");

    return wrapLanguageModel({
      model: openai(modelIdToUse),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return openai(modelId);
}

export function getTitleModel() {
  return openai("gpt-4.1-nano");
}

export function getArtifactModel() {
  return openai("gpt-4.1");
}
