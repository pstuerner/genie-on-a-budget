import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import { executeSqlQuery } from "./ai/tools/sql";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type executeSqlQueryTool = InferUITool<typeof executeSqlQuery>;

export type ChatTools = {
  executeSqlQuery: executeSqlQueryTool;
};

export type CustomUIDataTypes = {
  executeSqlQuery: any;
  appendMessage: string;
  id: string;
  title: string;
  clear: null;
  finish: null;
  "chat-title": string;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
