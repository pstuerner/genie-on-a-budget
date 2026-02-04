import {
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

const THINKING_SUFFIX_REGEX = /-thinking$/;

export function getLanguageModel(modelId: string) {
  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    const modelIdToUse = modelId.replace(THINKING_SUFFIX_REGEX, "");
    
    if (modelIdToUse === "gemini-2.5-flash") {
      return wrapLanguageModel({
        model: google(modelIdToUse),
        middleware: extractReasoningMiddleware({ tagName: "thinking" }),
      });
    }

    return wrapLanguageModel({
      model: openai(modelIdToUse),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }
  
  if (modelId === "gemini-2.5-flash") {
    return google(modelId);
  } else {
    return openai(modelId);
  }
}

export function getTitleModel() {
  return openai("gpt-4.1-nano");
}

export function getArtifactModel() {
  return openai("gpt-4.1");
}
