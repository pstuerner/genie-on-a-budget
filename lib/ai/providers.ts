import {
  extractReasoningMiddleware,
  wrapLanguageModel,
  type LanguageModelMiddleware,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { createDatabricksProvider } from "@databricks/ai-sdk-provider";

const THINKING_SUFFIX_REGEX = /-thinking$/;

/**
 * Databricks requires every assistant message to have either `content` or
 * `tool_calls`. The AI SDK can produce assistant messages with an empty
 * content array (e.g. during multi-step tool use), which Databricks rejects.
 * This middleware ensures every assistant message has at least one text part.
 */
const databricksMessageFixMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",
  transformParams: async ({ params }) => ({
    ...params,
    prompt: params.prompt.map((message) => {
      if (
        message.role === "assistant" &&
        (!message.content || message.content.length === 0)
      ) {
        return {
          ...message,
          content: [{ type: "text" as const, text: "" }],
        };
      }
      return message;
    }),
  }),
};

const databricks = createDatabricksProvider({
  baseURL: `https://${process.env.DATABRICKS_SERVER_HOSTNAME}/serving-endpoints`,
  headers: {
    Authorization: `Bearer ${process.env.DATABRICKS_ACCESS_TOKEN}`,
  },
});

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

  if (modelId.startsWith("databricks-")) {
    return wrapLanguageModel({
      model: databricks.chatCompletions(modelId),
      middleware: databricksMessageFixMiddleware,
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
